import { ARCHIVE_INDEX_SCHEMA_VERSION } from '../github/archive-index.constant';
import { ArchiveIndexEntry } from '../github/archive-index.interface';
import { EXPECTED_NEW_ENTRY, NEWER_ENTRY } from '../github/archive-index.mock';
import { EXPECTED_DELETED_HISTORY } from '../github/delete-event.mock';
import { EXISTING_HISTORY } from '../github/publish-event.mock';
import { RESULTS_FILE_SCHEMA_VERSION } from '../github/results-file.constant';
import { PROTOCOL_ROWS, RACE_EVENT } from '../github/spec-utils/race-fixtures';
import { AthletesHistory } from '../models/athletes-history.type';
import {
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_STATEMENTS,
  PROTOCOL_DB_SCHEMA_VERSION,
} from './protocol-db-schema.constant';
import {
  BEGIN_TRANSACTION_SQL,
  COMMIT_TRANSACTION_SQL,
  DELETE_ALL_ATHLETES_SQL,
  DELETE_ALL_EVENTS_SQL,
  DELETE_ALL_PARTICIPATIONS_SQL,
  DELETE_ALL_RUNS_SQL,
  DELETE_RESULTS_BY_SLUG_SQL,
  INSERT_ATHLETE_SQL,
  INSERT_EVENT_SQL,
  INSERT_PARTICIPATION_SQL,
  INSERT_RESULT_SQL,
  INSERT_RUN_SQL,
  PROTOCOL_DB_PAGE_SIZE_PRAGMA,
  SELECT_EVENT_META_SQL,
  UPSERT_META_SQL,
  VACUUM_SQL,
} from './protocol-db-write.constant';
import { ProtocolDbEventRemoval, ProtocolDbEventUpdate } from './protocol-db-write.interface';
import { FakeExecCall } from './spec-utils/fake-sqlite3';

export const EXISTING_DB_BYTES_MOCK = new Uint8Array([1, 2, 3, 4]);

/** Publishes `RACE_EVENT` (slug 2026-06-28) into an index that also keeps the untouched 2026-07-05 event. */
export const DB_UPDATE_MOCK: ProtocolDbEventUpdate = {
  indexFile: { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: [NEWER_ENTRY, EXPECTED_NEW_ENTRY] },
  history: EXISTING_HISTORY,
  resultsFile: { schemaVersion: RESULTS_FILE_SCHEMA_VERSION, event: RACE_EVENT, rows: PROTOCOL_ROWS },
};

/** Removes the 2026-06-28 event: only the untouched entry stays and the rollup loses its contribution. */
export const DB_REMOVAL_MOCK: ProtocolDbEventRemoval = {
  indexFile: { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: [NEWER_ENTRY] },
  history: EXPECTED_DELETED_HISTORY,
  slug: RACE_EVENT.dateIso,
};

const PRESERVED_CLUB_NAME = 'Старый клуб';

const PRESERVED_CHAIRMAN = 'Старый председатель';

/** The untouched event's row as `SELECT slug, club_name, chairman FROM events` returns it. */
export const PRESERVED_EVENT_META_ROW: unknown[] = [NEWER_ENTRY.slug, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN];

function eventInsert(entry: ArchiveIndexEntry, clubName: string, chairman: string): FakeExecCall {
  return {
    sql: INSERT_EVENT_SQL,
    bind: [
      entry.slug,
      entry.dateIso,
      entry.number,
      entry.city,
      entry.park,
      clubName,
      chairman,
      entry.participantCount,
      entry.finisherCount,
      entry.avgTimeMs,
      entry.bestMaleMs,
      entry.bestFemaleMs,
    ],
  };
}

const RESULT_INSERTS: FakeExecCall[] = PROTOCOL_ROWS.map((row) => ({
  sql: INSERT_RESULT_SQL,
  bind: [
    RACE_EVENT.dateIso,
    row.index,
    row.fullName,
    row.time23,
    row.time5,
    row.totalMs,
    row.distanceKm,
    row.gender,
    row.placeM,
    row.placeF,
    row.club,
    row.note,
  ],
}));

function athleteInserts(history: AthletesHistory): FakeExecCall[] {
  const calls: FakeExecCall[] = [];

  for (const athlete of Object.values(history)) {
    calls.push({ sql: INSERT_ATHLETE_SQL, bind: [athlete.key, athlete.displayName, athlete.gender, athlete.bestMs] });
    calls.push(
      ...athlete.runs.map(
        (run): FakeExecCall => ({ sql: INSERT_RUN_SQL, bind: [athlete.key, run.dateIso, run.slug, run.timeMs, run.distanceKm] }),
      ),
    );
    calls.push(...athlete.participationSlugs.map((slug): FakeExecCall => ({ sql: INSERT_PARTICIPATION_SQL, bind: [athlete.key, slug] })));
  }

  return calls;
}

/** The shared end of every sync: athletes rebuild, schema-version upsert, commit and compaction. */
function syncTail(history: AthletesHistory): FakeExecCall[] {
  return [
    { sql: DELETE_ALL_PARTICIPATIONS_SQL },
    { sql: DELETE_ALL_RUNS_SQL },
    { sql: DELETE_ALL_ATHLETES_SQL },
    ...athleteInserts(history),
    { sql: UPSERT_META_SQL, bind: [PROTOCOL_DB_META_SCHEMA_VERSION_KEY, PROTOCOL_DB_SCHEMA_VERSION] },
    { sql: COMMIT_TRANSACTION_SQL },
    { sql: VACUUM_SQL },
  ];
}

/** Deserialized db: the untouched event keeps its club meta, the published one takes it from the results file. */
export const EXPECTED_APPLY_EXECUTED_EXISTING: FakeExecCall[] = [
  { sql: SELECT_EVENT_META_SQL },
  { sql: BEGIN_TRANSACTION_SQL },
  { sql: DELETE_ALL_EVENTS_SQL },
  eventInsert(NEWER_ENTRY, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN),
  eventInsert(EXPECTED_NEW_ENTRY, RACE_EVENT.clubName, RACE_EVENT.chairman),
  { sql: DELETE_RESULTS_BY_SLUG_SQL, bind: [RACE_EVENT.dateIso] },
  ...RESULT_INSERTS,
  ...syncTail(EXISTING_HISTORY),
];

/** Fresh db: the 1 KiB page pragma precedes the DDL; the untouched event has no club meta to preserve. */
export const EXPECTED_APPLY_EXECUTED_FRESH: FakeExecCall[] = [
  { sql: PROTOCOL_DB_PAGE_SIZE_PRAGMA },
  ...PROTOCOL_DB_SCHEMA_STATEMENTS.map((sql): FakeExecCall => ({ sql })),
  { sql: SELECT_EVENT_META_SQL },
  { sql: BEGIN_TRANSACTION_SQL },
  { sql: DELETE_ALL_EVENTS_SQL },
  eventInsert(NEWER_ENTRY, '', ''),
  eventInsert(EXPECTED_NEW_ENTRY, RACE_EVENT.clubName, RACE_EVENT.chairman),
  { sql: DELETE_RESULTS_BY_SLUG_SQL, bind: [RACE_EVENT.dateIso] },
  ...RESULT_INSERTS,
  ...syncTail(EXISTING_HISTORY),
];

/** Removal: the removed slug's results are dropped and nothing is inserted in their place. */
export const EXPECTED_REMOVE_EXECUTED: FakeExecCall[] = [
  { sql: SELECT_EVENT_META_SQL },
  { sql: BEGIN_TRANSACTION_SQL },
  { sql: DELETE_ALL_EVENTS_SQL },
  eventInsert(NEWER_ENTRY, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN),
  { sql: DELETE_RESULTS_BY_SLUG_SQL, bind: [RACE_EVENT.dateIso] },
  ...syncTail(EXPECTED_DELETED_HISTORY),
];
