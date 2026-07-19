import { eq } from 'drizzle-orm';

import type { Database } from '@sqlite.org/sqlite-wasm';

import { buildIndexEntry, removeIndexEntry, renumberIndexEvents, upsertIndexEntry } from '../github/archive-index';
import { ArchiveIndexFile } from '../github/archive-index.interface';
import { buildEventResultsFile, toEventResults } from '../github/results-file';
import { EventResultsFile } from '../github/results-file.interface';
import { applyEventToHistory, removeEventFromHistory } from '../history/athletes-rollup';
import { AthletesHistory } from '../models/athletes-history.type';
import { RaceEvent } from '../models/race-event.interface';
import { EventWeather } from '../weather/event-weather.interface';
import { deserializeDbInto } from './deserialize-db';
import { narrowValues } from './protocol-db-narrow';
import { recomputeStoredNotes } from './protocol-db-notes';
import { storeOverallStats } from './protocol-db-overall-stats';
import { recomputeEventSummaryCounts } from './protocol-db-summary';
import { athletes, eventWeather, events as eventsTable, meta, participations, results as resultsTable, runs } from './protocol-db.schema';
import { readHistory, readIndexFile } from './protocol-db-read';
import {
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_STATEMENTS,
  PROTOCOL_DB_SCHEMA_VERSION,
  PROTOCOL_DB_V5_MIGRATION_STATEMENTS,
} from './protocol-db-schema.constant';
import { BEGIN_TRANSACTION_SQL, COMMIT_TRANSACTION_SQL, PROTOCOL_DB_PAGE_SIZE_PRAGMA, VACUUM_SQL } from './protocol-db-write.constant';
import { ProtocolDbEventMeta, ProtocolDbEventRemoval, ProtocolDbEventUpdate } from './protocol-db-write.interface';
import { createProtocolDrizzle, ProtocolDrizzle } from './protocol-drizzle';
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
  weather: PublishedWeather | null;
}

/** The published slug's publish-time weather readings; null (no fetch, or it failed) leaves the stored row alone. */
interface PublishedWeather {
  slug: string;
  readings: EventWeather;
}

/**
 * Wraps the SAME oo1 connection as a typed drizzle handle, so the reads and DML run through the
 * query-builder while the schema/transaction/export plumbing stays on raw `db.exec`. The executor is
 * synchronous under the hood; the `Promise.resolve` only satisfies the proxy-driver contract, and
 * awaiting it inside the manual transaction is safe because nothing else touches the connection.
 */
function oo1Drizzle(db: Database): ProtocolDrizzle {
  return createProtocolDrizzle({
    queryValues: (sql, params) =>
      Promise.resolve(db.exec(sql, { bind: [...params], rowMode: 'array', returnValue: 'resultRows' }).map(narrowValues)),
  });
}

/**
 * Applies one publication to the downloaded `sundayrun.db` bytes (null → a fresh db with the shared
 * schema) and returns the updated bytes. `sundayrun.db` is the single source of truth, so the write
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
  // The organisers' legacy number belongs to the archive, not the form: a re-publication keeps it.
  const legacyNumber = previous.index.events.find((entry) => entry.slug === slug)?.legacyNumber ?? update.event.legacyNumber;
  const event: RaceEvent = { ...update.event, legacyNumber };

  return {
    index: upsertIndexEntry(previous.index, buildIndexEntry(event, update.rows)),
    history,
    resultsFile: buildEventResultsFile(event, update.rows),
    removedSlug: null,
    weather: update.weather ? { slug, readings: update.weather } : null,
  };
}

/** Strips the removed slug from the previous state: its index entry, rollup contribution and results rows. */
function rollupDeletion(previous: PreviousState, removal: ProtocolDbEventRemoval): SyncTarget {
  return {
    index: removeIndexEntry(previous.index, removal.slug),
    history: removeEventFromHistory(previous.history, removal.slug),
    resultsFile: null,
    removedSlug: removal.slug,
    weather: null,
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

      // Downloaded bytes may predate the weather table; the statement is IF NOT EXISTS, so this is a no-op on v5 bytes.
      for (const statement of PROTOCOL_DB_V5_MIGRATION_STATEMENTS) {
        db.exec(statement);
      }
    }

    const ddb = oo1Drizzle(db);
    const rolled = rollup({ index: await readIndexFile(ddb), history: await readHistory(ddb) });
    // Numbers are positional, so any add or removal renumbers the whole archive.
    const target: SyncTarget = { ...rolled, index: renumberIndexEvents(rolled.index) };
    const eventMeta = await readEventMeta(ddb, target.resultsFile);

    db.exec(BEGIN_TRANSACTION_SQL);
    await rewriteEvents(ddb, target.index, eventMeta);
    await rewriteResults(ddb, target.resultsFile, target.removedSlug);
    await rewriteEventWeather(ddb, target.weather, target.removedSlug);
    await rewriteAthletes(ddb, target.history);
    // Every add or removal can shift later events' notes (first participation, records, year
    // bests), so the whole archive's notes converge in the same transaction.
    await recomputeStoredNotes(ddb);
    await recomputeEventSummaryCounts(ddb);
    // Site-wide totals for the home page, materialised from the same rollup the tables were written
    // from, so a single keyed `meta` read replaces the full-table aggregate scans on the client.
    await storeOverallStats(ddb, target.history);
    await ddb
      .insert(meta)
      .values({ key: PROTOCOL_DB_META_SCHEMA_VERSION_KEY, value: PROTOCOL_DB_SCHEMA_VERSION })
      .onConflictDoUpdate({ target: meta.key, set: { value: PROTOCOL_DB_SCHEMA_VERSION } });
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
async function readEventMeta(db: ProtocolDrizzle, resultsFile: EventResultsFile | null): Promise<Record<string, ProtocolDbEventMeta>> {
  const meta: Record<string, ProtocolDbEventMeta> = {};
  const rows = await db
    .select({ slug: eventsTable.slug, clubName: eventsTable.clubName, chairman: eventsTable.chairman })
    .from(eventsTable);

  for (const row of rows) {
    meta[row.slug] = { clubName: row.clubName, chairman: row.chairman };
  }

  if (resultsFile !== null) {
    meta[resultsFile.event.dateIso] = { clubName: resultsFile.event.clubName, chairman: resultsFile.event.chairman };
  }

  return meta;
}

/** `index` is the full updated truth (a few hundred rows), so a rewrite is simpler and safer than an upsert. */
async function rewriteEvents(db: ProtocolDrizzle, index: ArchiveIndexFile, eventMeta: Record<string, ProtocolDbEventMeta>): Promise<void> {
  await db.delete(eventsTable);

  if (index.events.length === 0) {
    return;
  }

  await db.insert(eventsTable).values(
    index.events.map((entry) => {
      const { clubName, chairman } = eventMeta[entry.slug];

      return {
        slug: entry.slug,
        dateIso: entry.dateIso,
        number: entry.number,
        legacyNumber: entry.legacyNumber,
        city: entry.city,
        park: entry.park,
        clubName,
        chairman,
        participantCount: entry.participantCount,
        finisherCount: entry.finisherCount,
        medianTimeMs: entry.medianTimeMs,
        medianMaleMs: entry.medianMaleMs,
        medianFemaleMs: entry.medianFemaleMs,
        bestMaleMs: entry.bestMaleMs,
        bestFemaleMs: entry.bestFemaleMs,
        newcomerCount: entry.newcomerCount,
        personalRecordCount: entry.personalRecordCount,
      };
    }),
  );
}

/** Replaces only the published slug's rows and/or drops the removed slug's; other events' results stay. */
async function rewriteResults(db: ProtocolDrizzle, resultsFile: EventResultsFile | null, removedSlug: string | null): Promise<void> {
  if (removedSlug !== null) {
    await db.delete(resultsTable).where(eq(resultsTable.slug, removedSlug));
  }

  if (resultsFile === null) {
    return;
  }

  const slug = resultsFile.event.dateIso;

  await db.delete(resultsTable).where(eq(resultsTable.slug, slug));

  if (resultsFile.rows.length === 0) {
    return;
  }

  await db.insert(resultsTable).values(
    resultsFile.rows.map((row) => ({
      slug,
      idx: row.index,
      fullName: row.fullName,
      time23: row.time23,
      time5: row.time5,
      totalMs: row.totalMs,
      distanceKm: row.distanceKm,
      gender: row.gender,
      placeM: row.placeM,
      placeF: row.placeF,
      club: row.club,
      note: row.note,
    })),
  );
}

/**
 * Upserts the published slug's weather and drops the removed slug's; every other row survives the
 * publication untouched — unlike `events`, this table is never rebuilt from the index, because the
 * readings are only fetchable around publish time.
 */
async function rewriteEventWeather(db: ProtocolDrizzle, weather: PublishedWeather | null, removedSlug: string | null): Promise<void> {
  if (removedSlug !== null) {
    await db.delete(eventWeather).where(eq(eventWeather.slug, removedSlug));
  }

  if (weather === null) {
    return;
  }

  const row = { slug: weather.slug, ...weather.readings };

  await db.insert(eventWeather).values(row).onConflictDoUpdate({ target: eventWeather.slug, set: row });
}

/** `athletes`/`runs`/`participations` mirror the rollup exactly, so a full rebuild guarantees db ≡ history. */
async function rewriteAthletes(db: ProtocolDrizzle, history: AthletesHistory): Promise<void> {
  await db.delete(participations);
  await db.delete(runs);
  await db.delete(athletes);

  const athleteRecords = Object.values(history);

  if (athleteRecords.length === 0) {
    return;
  }

  await db.insert(athletes).values(
    athleteRecords.map((athlete) => ({
      key: athlete.key,
      displayName: athlete.displayName,
      gender: athlete.gender,
      bestMs: athlete.bestMs,
    })),
  );

  const runRows = athleteRecords.flatMap((athlete) =>
    athlete.runs.map((run) => ({
      athleteKey: athlete.key,
      dateIso: run.dateIso,
      slug: run.slug,
      timeMs: run.timeMs,
      distanceKm: run.distanceKm,
    })),
  );

  // A pure-DNF event leaves every athlete run-less, so the array can be empty; an athlete always has
  // at least one participation, so — the empty-history case already returned — that insert is unguarded.
  if (runRows.length > 0) {
    await db.insert(runs).values(runRows);
  }

  await db
    .insert(participations)
    .values(athleteRecords.flatMap((athlete) => athlete.participationSlugs.map((slug) => ({ athleteKey: athlete.key, slug }))));
}
