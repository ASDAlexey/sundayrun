import type { Database, Sqlite3Static } from '@sqlite.org/sqlite-wasm';

import { ArchiveIndexFile } from '../github/archive-index.interface';
import { EventResultsFile } from '../github/results-file.interface';
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
  EMPTY_EVENT_META,
  INSERT_ATHLETE_SQL,
  INSERT_EVENT_SQL,
  INSERT_PARTICIPATION_SQL,
  INSERT_RESULT_SQL,
  INSERT_RUN_SQL,
  PROTOCOL_DB_MAIN_SCHEMA,
  PROTOCOL_DB_PAGE_SIZE_PRAGMA,
  SELECT_EVENT_META_SQL,
  UPSERT_META_SQL,
  VACUUM_SQL,
} from './protocol-db-write.constant';
import { ProtocolDbEventMeta, ProtocolDbEventRemoval, ProtocolDbEventUpdate } from './protocol-db-write.interface';
import { loadSqlite3 } from './sqlite-loader';

/**
 * Applies one publication to the downloaded `protocol.db` bytes (null → a fresh db with the
 * shared schema) and returns the updated bytes. The db is a derived artifact, so instead of
 * incremental SQL it is converged onto the already-updated in-memory state: `events` and the
 * athlete tables are fully rebuilt from `indexFile`/`history`, only the published slug's
 * `results` rows are replaced — other events' rows are kept as they are.
 */
export function applyEventToDb(dbBytes: Uint8Array | null, update: ProtocolDbEventUpdate): Promise<Uint8Array> {
  return syncDbToState(dbBytes, update.indexFile, update.history, update.resultsFile, null);
}

/** The deletion mirror of `applyEventToDb`: the same full rebuild, plus the removed slug's `results` rows are dropped. */
export function removeEventFromDb(dbBytes: Uint8Array | null, removal: ProtocolDbEventRemoval): Promise<Uint8Array> {
  return syncDbToState(dbBytes, removal.indexFile, removal.history, null, removal.slug);
}

/** One transaction that makes the db match the in-memory state, then compacts and exports it. */
async function syncDbToState(
  dbBytes: Uint8Array | null,
  indexFile: ArchiveIndexFile,
  history: AthletesHistory,
  resultsFile: EventResultsFile | null,
  removedSlug: string | null,
): Promise<Uint8Array> {
  const sqlite3 = await loadSqlite3();
  const db = new sqlite3.oo1.DB();

  try {
    if (dbBytes === null) {
      createSchema(db);
    } else {
      deserializeInto(sqlite3, db, dbBytes);
    }

    const eventMeta = readEventMeta(db, resultsFile);

    db.exec(BEGIN_TRANSACTION_SQL);
    rewriteEvents(db, indexFile, eventMeta);
    rewriteResults(db, resultsFile, removedSlug);
    rewriteAthletes(db, history);
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

/** Loads the downloaded db bytes into the fresh connection's `main` schema. */
function deserializeInto(sqlite3: Sqlite3Static, db: Database, dbBytes: Uint8Array): void {
  const pointer = sqlite3.wasm.allocFromTypedArray(dbBytes);
  const flags = sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE;

  db.checkRc(sqlite3.capi.sqlite3_deserialize(db, PROTOCOL_DB_MAIN_SCHEMA, pointer, dbBytes.byteLength, dbBytes.byteLength, flags));
}

/**
 * `club_name`/`chairman` live in per-event results files, not in `index.json`, so the full
 * `events` rewrite would lose them; they are re-read from the current rows first, with the
 * published event taking its values from the fresh results file.
 */
function readEventMeta(db: Database, resultsFile: EventResultsFile | null): Map<string, ProtocolDbEventMeta> {
  const rows = db.exec(SELECT_EVENT_META_SQL, { returnValue: 'resultRows', rowMode: 'array' });
  const meta = new Map(
    rows.map((row): [string, ProtocolDbEventMeta] => [String(row[0]), { clubName: String(row[1]), chairman: String(row[2]) }]),
  );

  if (resultsFile !== null) {
    meta.set(resultsFile.event.dateIso, { clubName: resultsFile.event.clubName, chairman: resultsFile.event.chairman });
  }

  return meta;
}

/** `indexFile` is the full updated truth (a few hundred rows), so a rewrite is simpler and safer than an upsert. */
function rewriteEvents(db: Database, indexFile: ArchiveIndexFile, eventMeta: Map<string, ProtocolDbEventMeta>): void {
  db.exec(DELETE_ALL_EVENTS_SQL);

  for (const entry of indexFile.events) {
    const { clubName, chairman } = eventMeta.get(entry.slug) ?? EMPTY_EVENT_META;

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

/** `athletes`/`runs`/`participations` mirror `athletes.json` exactly, so a full rebuild guarantees db ≡ json. */
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
