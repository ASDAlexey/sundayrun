import type { Database } from '@sqlite.org/sqlite-wasm';

import { buildIndexEntry, removeIndexEntry, upsertIndexEntry } from '../github/archive-index';
import { ArchiveIndexFile } from '../github/archive-index.interface';
import { buildEventResultsFile, toEventResults } from '../github/results-file';
import { EventResultsFile } from '../github/results-file.interface';
import { applyEventToHistory, removeEventFromHistory } from '../history/athletes-rollup';
import { AthletesHistory } from '../models/athletes-history.type';
import { deserializeDbInto } from './deserialize-db';
import { readHistory, readIndexFile } from './protocol-db-read';
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
import { ProtocolDbEventMeta, ProtocolDbEventRemoval, ProtocolDbEventUpdate } from './protocol-db-write.interface';
import { loadSqlite3 } from './sqlite-loader';

/** The previous archive and athletes rollup, read back out of the db the write is updating. */
interface PreviousState {
  index: ArchiveIndexFile;
  history: AthletesHistory;
}

/** The state the db is converged onto: the full index/history plus the slug's results to add or drop. */
interface SyncTarget {
  index: ArchiveIndexFile;
  history: AthletesHistory;
  resultsFile: EventResultsFile | null;
  removedSlug: string | null;
}

/**
 * Applies one publication to the downloaded `protocol.db` bytes (null → a fresh db with the shared
 * schema) and returns the updated bytes. `protocol.db` is the single source of truth, so the write
 * reads the previous archive and rollup back out of the db, rolls the event on top, and rebuilds the
 * `events` and athlete tables; only the published slug's `results` rows are replaced.
 */
export function applyEventToDb(dbBytes: Uint8Array | null, update: ProtocolDbEventUpdate): Promise<Uint8Array> {
  return syncDbToState(dbBytes, (previous) => rollupPublication(previous, update));
}

/** The deletion mirror of `applyEventToDb`: the same read-then-rebuild, minus the removed slug everywhere. */
export function removeEventFromDb(dbBytes: Uint8Array | null, removal: ProtocolDbEventRemoval): Promise<Uint8Array> {
  return syncDbToState(dbBytes, (previous) => rollupDeletion(previous, removal));
}

/** Rolls the published event onto the previous state: its rollup contribution, index entry and results. */
function rollupPublication(previous: PreviousState, update: ProtocolDbEventUpdate): SyncTarget {
  const slug = update.event.dateIso;
  const history = applyEventToHistory(
    removeEventFromHistory(previous.history, slug),
    { slug, dateIso: update.event.dateIso },
    toEventResults(update.rows),
  );

  return {
    index: upsertIndexEntry(previous.index, buildIndexEntry(update.event, update.rows)),
    history,
    resultsFile: buildEventResultsFile(update.event, update.rows),
    removedSlug: null,
  };
}

/** Strips the removed slug from the previous state: its index entry, rollup contribution and results rows. */
function rollupDeletion(previous: PreviousState, removal: ProtocolDbEventRemoval): SyncTarget {
  return {
    index: removeIndexEntry(previous.index, removal.slug),
    history: removeEventFromHistory(previous.history, removal.slug),
    resultsFile: null,
    removedSlug: removal.slug,
  };
}

/** Opens the db, reads its state, rolls up the change and rewrites the derived tables in one transaction. */
async function syncDbToState(dbBytes: Uint8Array | null, rollup: (previous: PreviousState) => SyncTarget): Promise<Uint8Array> {
  const sqlite3 = await loadSqlite3();
  const db = new sqlite3.oo1.DB();

  try {
    if (dbBytes === null) {
      createSchema(db);
    } else {
      deserializeDbInto(sqlite3, db, dbBytes);
    }

    const target = rollup({ index: readIndexFile(db), history: readHistory(db) });
    const eventMeta = readEventMeta(db, target.resultsFile);

    db.exec(BEGIN_TRANSACTION_SQL);
    rewriteEvents(db, target.index, eventMeta);
    rewriteResults(db, target.resultsFile, target.removedSlug);
    rewriteAthletes(db, target.history);
    db.exec(UPSERT_META_SQL, { bind: [PROTOCOL_DB_META_SCHEMA_VERSION_KEY, PROTOCOL_DB_SCHEMA_VERSION] });
    db.exec(COMMIT_TRANSACTION_SQL);
    db.exec(VACUUM_SQL);

    return sqlite3.capi.sqlite3_js_db_export(db);
  } finally {
    db.close();
  }
}

/** `page_size` only applies before the first page is written, so the pragma precedes the DDL. */
function createSchema(db: Database): void {
  db.exec(PROTOCOL_DB_PAGE_SIZE_PRAGMA);

  for (const statement of PROTOCOL_DB_SCHEMA_STATEMENTS) {
    db.exec(statement);
  }
}

/**
 * `club_name`/`chairman` live in per-event results files, not in the archive, so the full
 * `events` rewrite would lose them; they are re-read from the current rows first, with the
 * published event taking its values from the fresh results file. The archive is read back out of
 * the same `events` table, so every entry the rewrite writes has an entry here.
 */
function readEventMeta(db: Database, resultsFile: EventResultsFile | null): Record<string, ProtocolDbEventMeta> {
  const meta: Record<string, ProtocolDbEventMeta> = {};

  for (const row of db.exec(SELECT_EVENT_META_SQL, { returnValue: 'resultRows', rowMode: 'array' })) {
    meta[String(row[0])] = { clubName: String(row[1]), chairman: String(row[2]) };
  }

  if (resultsFile !== null) {
    meta[resultsFile.event.dateIso] = { clubName: resultsFile.event.clubName, chairman: resultsFile.event.chairman };
  }

  return meta;
}

/** `index` is the full updated truth (a few hundred rows), so a rewrite is simpler and safer than an upsert. */
function rewriteEvents(db: Database, index: ArchiveIndexFile, eventMeta: Record<string, ProtocolDbEventMeta>): void {
  db.exec(DELETE_ALL_EVENTS_SQL);

  for (const entry of index.events) {
    const { clubName, chairman } = eventMeta[entry.slug];

    db.exec(INSERT_EVENT_SQL, {
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
    });
  }
}

/** Replaces only the published slug's rows and/or drops the removed slug's; other events' results stay. */
function rewriteResults(db: Database, resultsFile: EventResultsFile | null, removedSlug: string | null): void {
  if (removedSlug !== null) {
    db.exec(DELETE_RESULTS_BY_SLUG_SQL, { bind: [removedSlug] });
  }

  if (resultsFile === null) {
    return;
  }

  const slug = resultsFile.event.dateIso;

  db.exec(DELETE_RESULTS_BY_SLUG_SQL, { bind: [slug] });

  for (const row of resultsFile.rows) {
    db.exec(INSERT_RESULT_SQL, {
      bind: [
        slug,
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
    });
  }
}

/** `athletes`/`runs`/`participations` mirror the rollup exactly, so a full rebuild guarantees db ≡ history. */
function rewriteAthletes(db: Database, history: AthletesHistory): void {
  db.exec(DELETE_ALL_PARTICIPATIONS_SQL);
  db.exec(DELETE_ALL_RUNS_SQL);
  db.exec(DELETE_ALL_ATHLETES_SQL);

  for (const athlete of Object.values(history)) {
    db.exec(INSERT_ATHLETE_SQL, { bind: [athlete.key, athlete.displayName, athlete.gender, athlete.bestMs] });

    for (const run of athlete.runs) {
      db.exec(INSERT_RUN_SQL, { bind: [athlete.key, run.dateIso, run.slug, run.timeMs, run.distanceKm] });
    }

    for (const slug of athlete.participationSlugs) {
      db.exec(INSERT_PARTICIPATION_SQL, { bind: [athlete.key, slug] });
    }
  }
}
