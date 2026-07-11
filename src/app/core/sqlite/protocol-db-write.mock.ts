import { EXPECTED_NEW_ENTRY, NEWER_ENTRY, OLDER_ENTRY, STALE_INDEX } from '../github/archive-index.mock';
import { ArchiveIndexEntry } from '../github/archive-index.interface';
import { EXPECTED_DELETED_HISTORY } from '../github/delete-event.mock';
import { EXPECTED_FIRST_PUBLISH_HISTORY, EXPECTED_PUBLISHED_HISTORY, EXISTING_HISTORY } from '../github/publish-event.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from '../github/spec-utils/race-fixtures';
import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';
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
  SELECT_ALL_ATHLETES_SQL,
  SELECT_ALL_EVENTS_SQL,
  SELECT_ALL_PARTICIPATIONS_SQL,
  SELECT_ALL_RUNS_SQL,
  SELECT_EVENT_META_SQL,
  UPSERT_META_SQL,
  VACUUM_SQL,
} from './protocol-db-write.constant';
import { ProtocolDbEventRemoval, ProtocolDbEventUpdate } from './protocol-db-write.interface';
import { FakeExecCall } from './spec-utils/fake-sqlite3';

export const EXISTING_DB_BYTES_MOCK = new Uint8Array([1, 2, 3, 4]);

/** Publishes `RACE_EVENT` (slug 2026-06-28); the write reads the previous state back out of the db. */
export const DB_UPDATE_MOCK: ProtocolDbEventUpdate = { event: RACE_EVENT, rows: PROTOCOL_ROWS };

/** Removes the 2026-06-28 event; the write reads the rest of the state from the db. */
export const DB_REMOVAL_MOCK: ProtocolDbEventRemoval = { slug: RACE_EVENT.dateIso };

/** Removes a slug that was never published, so every read athlete passes through the rewrite untouched. */
export const UNKNOWN_REMOVAL_MOCK: ProtocolDbEventRemoval = { slug: '2000-01-01' };

const MALE_ATHLETE_KEY = 'олег мужчина';

const DNF_ATHLETE_KEY = 'дмитрий днф';

const PRESERVED_CLUB_NAME = 'Старый клуб';

const PRESERVED_CHAIRMAN = 'Старый председатель';

/** The `events` rows `SELECT ... FROM events` returns for the previous archive (club columns excluded). */
function allEventsRow(entry: ArchiveIndexEntry): Record<string, unknown> {
  return {
    slug: entry.slug,
    date_iso: entry.dateIso,
    number: entry.number,
    city: entry.city,
    park: entry.park,
    participant_count: entry.participantCount,
    finisher_count: entry.finisherCount,
    avg_time_ms: entry.avgTimeMs,
    best_male_ms: entry.bestMaleMs,
    best_female_ms: entry.bestFemaleMs,
  };
}

function athleteRows(history: AthletesHistory): Record<string, unknown>[] {
  return Object.values(history).map((athlete) => ({
    key: athlete.key,
    display_name: athlete.displayName,
    gender: athlete.gender,
    best_ms: athlete.bestMs,
  }));
}

function runRows(history: AthletesHistory): Record<string, unknown>[] {
  return Object.values(history).flatMap((athlete) =>
    athlete.runs.map((run) => ({
      athlete_key: athlete.key,
      date_iso: run.dateIso,
      slug: run.slug,
      time_ms: run.timeMs,
      distance_km: run.distanceKm,
    })),
  );
}

function participationRows(history: AthletesHistory): Record<string, unknown>[] {
  return Object.values(history).flatMap((athlete) => athlete.participationSlugs.map((slug) => ({ athlete_key: athlete.key, slug })));
}

/** The four object-mode reads that reconstruct the previous archive and rollup from the db. */
export const PREVIOUS_DB_ROWS: Record<string, unknown[]> = {
  [SELECT_ALL_EVENTS_SQL]: STALE_INDEX.events.map(allEventsRow),
  [SELECT_ALL_ATHLETES_SQL]: athleteRows(EXISTING_HISTORY),
  [SELECT_ALL_RUNS_SQL]: runRows(EXISTING_HISTORY),
  [SELECT_ALL_PARTICIPATIONS_SQL]: participationRows(EXISTING_HISTORY),
};

/** Each previous event's `SELECT slug, club_name, chairman FROM events` row, all sharing the preserved club meta. */
export const PRESERVED_EVENT_META_ROWS: unknown[][] = STALE_INDEX.events.map((entry) => [
  entry.slug,
  PRESERVED_CLUB_NAME,
  PRESERVED_CHAIRMAN,
]);

/** The five reads every sync runs before it writes: the archive, the three rollup tables and the club meta. */
const READ_CALLS: FakeExecCall[] = [
  { sql: SELECT_ALL_EVENTS_SQL },
  { sql: SELECT_ALL_ATHLETES_SQL },
  { sql: SELECT_ALL_RUNS_SQL },
  { sql: SELECT_ALL_PARTICIPATIONS_SQL },
  { sql: SELECT_EVENT_META_SQL },
];

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

/** Deserialized db: the stale entry for the re-published slug is replaced, the untouched events keep their club meta. */
export const EXPECTED_APPLY_EXECUTED_EXISTING: FakeExecCall[] = [
  ...READ_CALLS,
  { sql: BEGIN_TRANSACTION_SQL },
  { sql: DELETE_ALL_EVENTS_SQL },
  eventInsert(NEWER_ENTRY, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN),
  eventInsert(EXPECTED_NEW_ENTRY, RACE_EVENT.clubName, RACE_EVENT.chairman),
  eventInsert(OLDER_ENTRY, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN),
  { sql: DELETE_RESULTS_BY_SLUG_SQL, bind: [RACE_EVENT.dateIso] },
  ...RESULT_INSERTS,
  ...syncTail(EXPECTED_PUBLISHED_HISTORY),
];

/** Fresh db: the 1 KiB page pragma precedes the DDL; the empty reads yield an index with only the new event. */
export const EXPECTED_APPLY_EXECUTED_FRESH: FakeExecCall[] = [
  { sql: PROTOCOL_DB_PAGE_SIZE_PRAGMA },
  ...PROTOCOL_DB_SCHEMA_STATEMENTS.map((sql): FakeExecCall => ({ sql })),
  ...READ_CALLS,
  { sql: BEGIN_TRANSACTION_SQL },
  { sql: DELETE_ALL_EVENTS_SQL },
  eventInsert(EXPECTED_NEW_ENTRY, RACE_EVENT.clubName, RACE_EVENT.chairman),
  { sql: DELETE_RESULTS_BY_SLUG_SQL, bind: [RACE_EVENT.dateIso] },
  ...RESULT_INSERTS,
  ...syncTail(EXPECTED_FIRST_PUBLISH_HISTORY),
];

/** Removal: the removed slug drops out of the archive (db order, no results inserted) and out of the rollup. */
export const EXPECTED_REMOVE_EXECUTED: FakeExecCall[] = [
  ...READ_CALLS,
  { sql: BEGIN_TRANSACTION_SQL },
  { sql: DELETE_ALL_EVENTS_SQL },
  eventInsert(OLDER_ENTRY, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN),
  eventInsert(NEWER_ENTRY, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN),
  { sql: DELETE_RESULTS_BY_SLUG_SQL, bind: [RACE_EVENT.dateIso] },
  ...syncTail(EXPECTED_DELETED_HISTORY),
];

/** A previous state whose read athletes span a male and a DNF (gender null), exercising every gender branch. */
export const MIXED_GENDER_DB_ROWS: Record<string, unknown[]> = {
  [SELECT_ALL_EVENTS_SQL]: [allEventsRow(NEWER_ENTRY)],
  [SELECT_ALL_ATHLETES_SQL]: [
    { key: MALE_ATHLETE_KEY, display_name: 'Олег Мужчина', gender: Gender.male, best_ms: 1200000 },
    { key: DNF_ATHLETE_KEY, display_name: 'Дмитрий ДНФ', gender: null, best_ms: null },
  ],
  [SELECT_ALL_RUNS_SQL]: [],
  [SELECT_ALL_PARTICIPATIONS_SQL]: [
    { athlete_key: MALE_ATHLETE_KEY, slug: NEWER_ENTRY.slug },
    { athlete_key: DNF_ATHLETE_KEY, slug: NEWER_ENTRY.slug },
  ],
};

export const MIXED_GENDER_META_ROWS: unknown[][] = [[NEWER_ENTRY.slug, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN]];

/** Both read athletes pass through untouched, so the male code and the null gender are written straight back. */
export const EXPECTED_PASSTHROUGH_ATHLETE_INSERTS: FakeExecCall[] = [
  { sql: INSERT_ATHLETE_SQL, bind: [MALE_ATHLETE_KEY, 'Олег Мужчина', Gender.male, 1200000] },
  { sql: INSERT_ATHLETE_SQL, bind: [DNF_ATHLETE_KEY, 'Дмитрий ДНФ', null, null] },
];
