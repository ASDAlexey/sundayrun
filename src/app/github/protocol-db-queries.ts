import { ArchiveIndexEntry } from '../core/github/archive-index.interface';
import { eventFilePaths } from '../core/github/event-paths';
import { buildEventResultsFile } from '../core/github/results-file';
import { EventResultsFile } from '../core/github/results-file.interface';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { isoYear } from '../core/history/iso-year';
import { OverallStats } from '../core/history/overall-stats.interface';
import { AthleteRecord, AthleteRun } from '../core/models/athlete-history.interface';
import { Gender, GenderType } from '../core/models/gender.enum';
import { ProtocolRow } from '../core/models/protocol-row.interface';
import { RaceEvent } from '../core/models/race-event.interface';
import {
  SELECT_ATHLETE_PARTICIPATIONS_SQL,
  SELECT_ATHLETE_RUNS_SQL,
  SELECT_ATHLETE_SQL,
  SELECT_EVENT_RESULTS_SQL,
  SELECT_EVENT_SQL,
  SELECT_EVENTS_SQL,
  SELECT_LATEST_EVENTS_SQL,
  SELECT_MEDIAN_TIME_SQL,
  SELECT_OVERALL_COUNTS_SQL,
  SELECT_RANKED_ATHLETES_SQL,
  SELECT_YEAR_BEST_RUNS_SQL,
} from './protocol-db-queries.constant';
import { asGender, asNumber, asNumberOrNull, asString } from './protocol-db-row';
import { ProtocolDb } from './protocol-db.interface';
import { ProtocolDbRow } from './protocol-db.service.type';

/**
 * The typed reads the public pages run against `protocol.db` — each mirrors what the page
 * used to derive from a whole JSON file, but touches only the db pages its keys live on.
 * Every function returns the exact shape the existing page logic consumes, coercing each
 * aliased column of the untyped rows the service hands back.
 */

/** The athlete page payload: the full record of one athlete, or null when the key is unknown. */
export async function selectAthleteRecord(db: ProtocolDb, key: string): Promise<AthleteRecord | null> {
  const athletes = await db.query(SELECT_ATHLETE_SQL, { $key: key });

  if (athletes.length === 0) {
    return null;
  }

  const [runRows, participationRows] = await Promise.all([
    db.query(SELECT_ATHLETE_RUNS_SQL, { $key: key }),
    db.query(SELECT_ATHLETE_PARTICIPATIONS_SQL, { $key: key }),
  ]);
  const runs = runRows.map(toAthleteRun);

  return {
    key,
    displayName: asString(athletes[0]['displayName']),
    gender: asGender(athletes[0]['gender']),
    participationSlugs: participationRows.map((row) => asString(row['slug'])),
    runs,
    bestMs: asNumberOrNull(athletes[0]['bestMs']),
    bestMsByYear: bestMsByYear(runs),
  };
}

/**
 * The records-page leaderboard source: every ranked athlete with exactly the runs the boards
 * read — one per season, the earliest run of that year's best. `participationSlugs` stays
 * empty (no board reads it), so the participations table is never fetched.
 */
export async function selectAthleteRecords(db: ProtocolDb): Promise<AthleteRecord[]> {
  const [athleteRows, yearBestRows] = await Promise.all([
    db.query(SELECT_RANKED_ATHLETES_SQL),
    db.query(SELECT_YEAR_BEST_RUNS_SQL, { $distanceKm: FIVE_KM_DISTANCE_KM }),
  ]);
  const runsByKey = new Map<string, AthleteRun[]>();

  for (const yearBest of yearBestRows) {
    const athleteKey = asString(yearBest['athleteKey']);
    const runs = runsByKey.get(athleteKey) ?? [];

    runs.push({
      dateIso: asString(yearBest['dateIso']),
      slug: asString(yearBest['slug']),
      timeMs: asNumber(yearBest['timeMs']),
      distanceKm: FIVE_KM_DISTANCE_KM,
    });
    runsByKey.set(athleteKey, runs);
  }

  return athleteRows.map((row) => toLeaderboardRecord(row, runsByKey));
}

/** Site-wide totals via SQL aggregates, shaped exactly like `computeOverallStats`. */
export async function selectOverallStats(db: ProtocolDb): Promise<OverallStats> {
  const [countsRows, medianTimeMenMs, medianTimeWomenMs] = await Promise.all([
    db.query(SELECT_OVERALL_COUNTS_SQL),
    selectMedianTimeMs(db, Gender.male),
    selectMedianTimeMs(db, Gender.female),
  ]);
  const counts = countsRows[0];
  const finishesCount = asNumber(counts['finishesCount']);
  const finishersCount = asNumber(counts['finishersCount']);

  return {
    eventsCount: asNumber(counts['eventsCount']),
    finishesCount,
    finishersCount,
    averageFinishes: finishersCount === 0 ? 0 : finishesCount / finishersCount,
    medianTimeMenMs,
    medianTimeWomenMs,
  };
}

/** The archive list, newest first like the JSON index; `limit` serves the home preview. */
export async function selectArchiveEvents(db: ProtocolDb, limit?: number): Promise<ArchiveIndexEntry[]> {
  const events = limit === undefined ? await db.query(SELECT_EVENTS_SQL) : await db.query(SELECT_LATEST_EVENTS_SQL, { $limit: limit });

  return events.map(toArchiveEntry);
}

/** One published event — its metadata plus every protocol row — or null when the slug is unknown. */
export async function selectEventResults(db: ProtocolDb, slug: string): Promise<EventResultsFile | null> {
  const events = await db.query(SELECT_EVENT_SQL, { $slug: slug });

  if (events.length === 0) {
    return null;
  }

  const rows = await db.query(SELECT_EVENT_RESULTS_SQL, { $slug: slug });

  return buildEventResultsFile(toRaceEvent(events[0]), rows.map(toProtocolRow));
}

function toRaceEvent(row: ProtocolDbRow): RaceEvent {
  return {
    number: asNumber(row['number']),
    dateIso: asString(row['dateIso']),
    city: asString(row['city']),
    park: asString(row['park']),
    clubName: asString(row['clubName']),
    chairman: asString(row['chairman']),
  };
}

function toProtocolRow(row: ProtocolDbRow): ProtocolRow {
  return {
    index: asNumber(row['index']),
    fullName: asString(row['fullName']),
    time23: asString(row['time23']),
    time5: asString(row['time5']),
    totalMs: asNumberOrNull(row['totalMs']),
    distanceKm: asNumberOrNull(row['distanceKm']),
    gender: asGender(row['gender']),
    placeM: asNumberOrNull(row['placeM']),
    placeF: asNumberOrNull(row['placeF']),
    club: asString(row['club']),
    note: asString(row['note']),
  };
}

/** One run of an athlete history/leaderboard, read off its aliased row. */
function toAthleteRun(row: ProtocolDbRow): AthleteRun {
  return {
    dateIso: asString(row['dateIso']),
    slug: asString(row['slug']),
    timeMs: asNumber(row['timeMs']),
    distanceKm: asNumber(row['distanceKm']),
  };
}

function toLeaderboardRecord(row: ProtocolDbRow, runsByKey: Map<string, AthleteRun[]>): AthleteRecord {
  const key = asString(row['key']);
  const runs = runsByKey.get(key) ?? [];

  return {
    key,
    displayName: asString(row['displayName']),
    gender: asGender(row['gender']),
    participationSlugs: [],
    runs,
    bestMs: asNumberOrNull(row['bestMs']),
    bestMsByYear: bestMsByYear(runs),
  };
}

// File paths are not stored in the db — they follow from the date, see `eventFilePaths`.
function toArchiveEntry(row: ProtocolDbRow): ArchiveIndexEntry {
  const dateIso = asString(row['dateIso']);

  return {
    slug: asString(row['slug']),
    dateIso,
    number: asNumber(row['number']),
    city: asString(row['city']),
    park: asString(row['park']),
    participantCount: asNumber(row['participantCount']),
    finisherCount: asNumberOrNull(row['finisherCount']),
    avgTimeMs: asNumberOrNull(row['avgTimeMs']),
    bestMaleMs: asNumberOrNull(row['bestMaleMs']),
    bestFemaleMs: asNumberOrNull(row['bestFemaleMs']),
    files: eventFilePaths(dateIso),
  };
}

/** Recomputed from the runs like `athletes-rollup` does: the fastest 5 km time of each year. */
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

/** Rounded like the JSON path rounds the mean of the two middle values; an empty sample is 0. */
async function selectMedianTimeMs(db: ProtocolDb, gender: GenderType): Promise<number> {
  const medians = await db.query(SELECT_MEDIAN_TIME_SQL, { $gender: gender, $distanceKm: FIVE_KM_DISTANCE_KM });

  return Math.round(asNumberOrNull(medians[0]['medianMs']) ?? 0);
}
