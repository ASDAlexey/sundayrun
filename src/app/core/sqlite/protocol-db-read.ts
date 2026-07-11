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
import {
  SELECT_ALL_ATHLETES_SQL,
  SELECT_ALL_EVENTS_SQL,
  SELECT_ALL_PARTICIPATIONS_SQL,
  SELECT_ALL_RUNS_SQL,
} from './protocol-db-write.constant';
import { loadSqlite3 } from './sqlite-loader';

/**
 * Reconstructs the accumulated athletes history from a downloaded `protocol.db` image. The admin
 * import reads it through the authorized Contents API rather than a range request, so it needs the
 * whole file in memory: the CDN would serve a stale copy during a back-to-back import of old events.
 */
export async function readHistoryFromDb(dbBytes: Uint8Array): Promise<AthletesHistory> {
  const sqlite3 = await loadSqlite3();
  const db = new sqlite3.oo1.DB();

  try {
    deserializeDbInto(sqlite3, db, dbBytes);

    return readHistory(db);
  } finally {
    db.close();
  }
}

/** Reconstructs the archive from the `events` table — the reverse of `rewriteEvents`, minus club meta. */
export function readIndexFile(db: Database): ArchiveIndexFile {
  const events = db.exec(SELECT_ALL_EVENTS_SQL, { rowMode: 'object', returnValue: 'resultRows' }).map((row): ArchiveIndexEntry => {
    const dateIso = readString(row['date_iso']);

    return {
      slug: readString(row['slug']),
      dateIso,
      number: readNumber(row['number']),
      city: readString(row['city']),
      park: readString(row['park']),
      participantCount: readNumber(row['participant_count']),
      finisherCount: readNumberOrNull(row['finisher_count']),
      avgTimeMs: readNumberOrNull(row['avg_time_ms']),
      bestMaleMs: readNumberOrNull(row['best_male_ms']),
      bestFemaleMs: readNumberOrNull(row['best_female_ms']),
      files: eventFilePaths(dateIso),
    };
  });

  return { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events };
}

/**
 * Reassembles the athletes history from its three tables — the reverse of `rewriteAthletes`.
 * `bestMsByYear` is derived, never stored, so it is recomputed from each record's 5 km runs, giving
 * the admin import the same complete history the old `athletes.json` carried.
 */
export function readHistory(db: Database): AthletesHistory {
  const history: AthletesHistory = {};

  for (const row of db.exec(SELECT_ALL_ATHLETES_SQL, { rowMode: 'object', returnValue: 'resultRows' })) {
    const key = readString(row['key']);

    history[key] = {
      key,
      displayName: readString(row['display_name']),
      gender: readGender(row['gender']),
      participationSlugs: [],
      runs: [],
      bestMs: readNumberOrNull(row['best_ms']),
      bestMsByYear: {},
    };
  }

  for (const row of db.exec(SELECT_ALL_RUNS_SQL, { rowMode: 'object', returnValue: 'resultRows' })) {
    history[readString(row['athlete_key'])].runs.push({
      dateIso: readString(row['date_iso']),
      slug: readString(row['slug']),
      timeMs: readNumber(row['time_ms']),
      distanceKm: readNumber(row['distance_km']),
    });
  }

  for (const row of db.exec(SELECT_ALL_PARTICIPATIONS_SQL, { rowMode: 'object', returnValue: 'resultRows' })) {
    history[readString(row['athlete_key'])].participationSlugs.push(readString(row['slug']));
  }

  for (const record of Object.values(history)) {
    record.bestMsByYear = bestMsByYear(record.runs);
  }

  return history;
}

/** The fastest 5 km time of each season, recomputed from the runs like the rollup keeps it. */
function bestMsByYear(runs: AthleteRun[]): Record<string, number> {
  const bests: Record<string, number> = {};

  for (const run of runs) {
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

/** A required text column, read straight back as a string. */
function readString(value: unknown): string {
  return String(value);
}

/** A required numeric column, read back as a number. */
function readNumber(value: unknown): number {
  return Number(value);
}

/** A nullable numeric column: SQL null is preserved, every other value becomes a number. */
function readNumberOrNull(value: unknown): number | null {
  return value === null ? null : Number(value);
}

/** A gender column: only the two known codes survive; anything else — including null — reads as null. */
function readGender(value: unknown): GenderType | null {
  return value === Gender.male || value === Gender.female ? value : null;
}
