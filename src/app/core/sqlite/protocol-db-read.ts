import type { Database } from '@sqlite.org/sqlite-wasm';

import { ARCHIVE_INDEX_SCHEMA_VERSION } from '../github/archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from '../github/archive-index.interface';
import { eventFilePaths } from '../github/event-paths';
import { FIVE_KM_DISTANCE_KM } from '../history/distance.constant';
import { isoYear } from '../history/iso-year';
import { AthleteRun } from '../models/athlete-history.interface';
import { AthletesHistory } from '../models/athletes-history.type';
import { Gender, GenderType } from '../models/gender.enum';
import { deserializeDbInto } from './deserialize-db';
import { narrowValues } from './protocol-db-narrow';
import { athletes, events, participations, runs } from './protocol-db.schema';
import { createProtocolDrizzle, ProtocolDrizzle } from './protocol-drizzle';
import { loadSqlite3 } from './sqlite-loader';

/**
 * Reconstructs the accumulated athletes history from a downloaded `sundayrun.db` image. The admin
 * import reads it through the authorized Contents API rather than a range request, so it needs the
 * whole file in memory: the CDN would serve a stale copy during a back-to-back import of old events.
 */
export async function readHistoryFromDb(dbBytes: Uint8Array): Promise<AthletesHistory> {
  const sqlite3 = await loadSqlite3();
  const db = new sqlite3.oo1.DB();

  try {
    deserializeDbInto(sqlite3, db, dbBytes);

    return await readHistory(oo1Drizzle(db));
  } finally {
    db.close();
  }
}

/**
 * Wraps a synchronous oo1 connection as a typed drizzle handle for the table reads. The proxy driver
 * is async, so the sync `db.exec` result is resolved through a settled promise; the read path never
 * interleaves other work on the connection, so this stays a straight, ordered read.
 */
function oo1Drizzle(db: Database): ProtocolDrizzle {
  return createProtocolDrizzle({
    queryValues: (sql, params) =>
      Promise.resolve(db.exec(sql, { bind: [...params], rowMode: 'array', returnValue: 'resultRows' }).map(narrowValues)),
  });
}

/** Reconstructs the archive from the `events` table — the reverse of `rewriteEvents`, minus club meta. */
export async function readIndexFile(db: ProtocolDrizzle): Promise<ArchiveIndexFile> {
  const rows = await db
    .select({
      slug: events.slug,
      dateIso: events.dateIso,
      number: events.number,
      legacyNumber: events.legacyNumber,
      city: events.city,
      park: events.park,
      participantCount: events.participantCount,
      finisherCount: events.finisherCount,
      medianTimeMs: events.medianTimeMs,
      bestMaleMs: events.bestMaleMs,
      bestFemaleMs: events.bestFemaleMs,
      newcomerCount: events.newcomerCount,
      personalRecordCount: events.personalRecordCount,
    })
    .from(events);

  return {
    schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION,
    events: rows.map(
      (row): ArchiveIndexEntry => ({
        slug: row.slug,
        dateIso: row.dateIso,
        number: row.number,
        legacyNumber: row.legacyNumber,
        city: row.city,
        park: row.park,
        participantCount: row.participantCount,
        finisherCount: row.finisherCount,
        medianTimeMs: row.medianTimeMs,
        bestMaleMs: row.bestMaleMs,
        bestFemaleMs: row.bestFemaleMs,
        newcomerCount: row.newcomerCount,
        personalRecordCount: row.personalRecordCount,
        files: eventFilePaths(row.dateIso),
      }),
    ),
  };
}

/**
 * Reassembles the athletes history from its three tables — the reverse of `rewriteAthletes`.
 * `bestMsByYear` is derived, never stored, so it is recomputed from each record's 5 km runs, giving
 * the admin import the same complete history the old `athletes.json` carried.
 */
export async function readHistory(db: ProtocolDrizzle): Promise<AthletesHistory> {
  const history: AthletesHistory = {};

  const [athleteRows, runRows, participationRows] = await Promise.all([
    db.select({ key: athletes.key, displayName: athletes.displayName, gender: athletes.gender, bestMs: athletes.bestMs }).from(athletes),
    db
      .select({ athleteKey: runs.athleteKey, dateIso: runs.dateIso, slug: runs.slug, timeMs: runs.timeMs, distanceKm: runs.distanceKm })
      .from(runs),
    db.select({ athleteKey: participations.athleteKey, slug: participations.slug }).from(participations),
  ]);

  for (const row of athleteRows) {
    history[row.key] = {
      key: row.key,
      displayName: row.displayName,
      gender: asGender(row.gender),
      participationSlugs: [],
      runs: [],
      bestMs: row.bestMs,
      bestMsByYear: {},
    };
  }

  for (const row of runRows) {
    history[row.athleteKey].runs.push({ dateIso: row.dateIso, slug: row.slug, timeMs: row.timeMs, distanceKm: row.distanceKm });
  }

  for (const row of participationRows) {
    history[row.athleteKey].participationSlugs.push(row.slug);
  }

  for (const record of Object.values(history)) {
    record.bestMsByYear = bestMsByYear(record.runs);
  }

  return history;
}

/** The fastest 5 km time of each season, recomputed from the runs like the rollup keeps it. */
function bestMsByYear(runsForKey: AthleteRun[]): Record<string, number> {
  const bests: Record<string, number> = {};

  for (const run of runsForKey) {
    if (run.distanceKm !== FIVE_KM_DISTANCE_KM) {
      continue;
    }

    const year = isoYear(run.dateIso);
    const yearBestMs: number | undefined = bests[year];

    if (yearBestMs === undefined || run.timeMs < yearBestMs) {
      bests[year] = run.timeMs;
    }
  }

  return bests;
}

/** A gender column: only the two known codes survive; anything else — including null — reads as null. */
export function asGender(value: string | null): GenderType | null {
  return value === Gender.male || value === Gender.female ? value : null;
}
