import { ArchiveIndexEntry } from '../core/github/archive-index.interface';
import { EXISTING_INDEX } from '../core/github/archive-index.mock';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { OverallStats } from '../core/history/overall-stats.interface';
import { AthleteRecord, AthleteRun } from '../core/models/athlete-history.interface';
import { Gender } from '../core/models/gender.enum';
import { AthleteSqlRow, MedianTimeSqlRow, OverallCountsSqlRow, ParticipationSqlRow, YearBestSqlRow } from './protocol-db-queries.interface';

export const ATHLETE_SQL_ROW: AthleteSqlRow = { key: 'иванов иван', displayName: 'Иванов Иван', gender: Gender.male, bestMs: 1500000 };

export const UNKNOWN_ATHLETE_KEY = 'нет такого';

/**
 * Every year-best branch: 2024 improves on a second run, 2025 opens with its best and keeps
 * it against a slower run, and the 2.3 km run never counts.
 */
export const ATHLETE_RUN_ROWS: AthleteRun[] = [
  { dateIso: '2024-05-05', slug: '2024-05-05', timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM },
  { dateIso: '2024-06-06', slug: '2024-06-06', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
  { dateIso: '2025-03-03', slug: '2025-03-03', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
  { dateIso: '2025-04-04', slug: '2025-04-04', timeMs: 999000, distanceKm: 2.3 },
  { dateIso: '2025-05-05', slug: '2025-05-05', timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM },
];

export const ATHLETE_PARTICIPATION_ROWS: ParticipationSqlRow[] = ATHLETE_RUN_ROWS.map((run) => ({ slug: run.slug }));

export const EXPECTED_ATHLETE_RECORD: AthleteRecord = {
  key: ATHLETE_SQL_ROW.key,
  displayName: ATHLETE_SQL_ROW.displayName,
  gender: Gender.male,
  participationSlugs: ATHLETE_RUN_ROWS.map((run) => run.slug),
  runs: ATHLETE_RUN_ROWS,
  bestMs: ATHLETE_SQL_ROW.bestMs,
  bestMsByYear: { '2024': 1500000, '2025': 1560000 },
};

/** Ranked (a non-null best), yet without year-best rows — assembly must tolerate the gap. */
export const RUNLESS_ATHLETE_SQL_ROW: AthleteSqlRow = {
  key: 'новикова нина',
  displayName: 'Новикова Нина',
  gender: Gender.female,
  bestMs: 1700000,
};

/** A ranked athlete whose gender was never resolved — the null code must survive the read. */
export const GENDERLESS_ATHLETE_SQL_ROW: AthleteSqlRow = {
  key: 'соколов саша',
  displayName: 'Соколов Саша',
  gender: null,
  bestMs: 1800000,
};

export const RANKED_ATHLETE_ROWS: AthleteSqlRow[] = [ATHLETE_SQL_ROW, RUNLESS_ATHLETE_SQL_ROW, GENDERLESS_ATHLETE_SQL_ROW];

/** One row per season: the year's best time carried by its earliest run. */
export const YEAR_BEST_ROWS: YearBestSqlRow[] = [
  { athleteKey: ATHLETE_SQL_ROW.key, dateIso: '2024-06-06', slug: '2024-06-06', timeMs: 1500000 },
  { athleteKey: ATHLETE_SQL_ROW.key, dateIso: '2025-03-03', slug: '2025-03-03', timeMs: 1560000 },
];

export const EXPECTED_LEADERBOARD_RECORDS: AthleteRecord[] = [
  {
    key: ATHLETE_SQL_ROW.key,
    displayName: ATHLETE_SQL_ROW.displayName,
    gender: Gender.male,
    participationSlugs: [],
    runs: [
      { dateIso: '2024-06-06', slug: '2024-06-06', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2025-03-03', slug: '2025-03-03', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: ATHLETE_SQL_ROW.bestMs,
    bestMsByYear: { '2024': 1500000, '2025': 1560000 },
  },
  {
    key: RUNLESS_ATHLETE_SQL_ROW.key,
    displayName: RUNLESS_ATHLETE_SQL_ROW.displayName,
    gender: Gender.female,
    participationSlugs: [],
    runs: [],
    bestMs: RUNLESS_ATHLETE_SQL_ROW.bestMs,
    bestMsByYear: {},
  },
  {
    key: GENDERLESS_ATHLETE_SQL_ROW.key,
    displayName: GENDERLESS_ATHLETE_SQL_ROW.displayName,
    gender: null,
    participationSlugs: [],
    runs: [],
    bestMs: GENDERLESS_ATHLETE_SQL_ROW.bestMs,
    bestMsByYear: {},
  },
];

export const OVERALL_COUNTS_ROW: OverallCountsSqlRow = { eventsCount: 3, finishesCount: 8, finishersCount: 3 };

/** `AVG` of an even sample can carry a half — the TS side must round like the JSON path. */
export const MEN_MEDIAN_ROW: MedianTimeSqlRow = { medianMs: 1922500.5 };

/** No finished 5 km runs for the gender: `AVG` over the empty sample is null. */
export const EMPTY_MEDIAN_ROW: MedianTimeSqlRow = { medianMs: null };

export const EXPECTED_SQL_STATS: OverallStats = {
  eventsCount: 3,
  finishesCount: 8,
  finishersCount: 3,
  averageFinishes: 8 / 3,
  medianTimeMenMs: 1922501,
  medianTimeWomenMs: 0,
};

export const EMPTY_COUNTS_ROW: OverallCountsSqlRow = { eventsCount: 0, finishesCount: 0, finishersCount: 0 };

export const EXPECTED_EMPTY_SQL_STATS: OverallStats = {
  eventsCount: 0,
  finishesCount: 0,
  finishersCount: 0,
  averageFinishes: 0,
  medianTimeMenMs: 0,
  medianTimeWomenMs: 0,
};

/** `EXISTING_INDEX.events` as the db serves them — `files` is reconstructed on read. */
export const EVENT_SQL_ROWS: Omit<ArchiveIndexEntry, 'files'>[] = EXISTING_INDEX.events.map((entry) => ({
  slug: entry.slug,
  dateIso: entry.dateIso,
  number: entry.number,
  city: entry.city,
  park: entry.park,
  participantCount: entry.participantCount,
  finisherCount: entry.finisherCount,
  avgTimeMs: entry.avgTimeMs,
  bestMaleMs: entry.bestMaleMs,
  bestFemaleMs: entry.bestFemaleMs,
}));

export const LATEST_EVENTS_LIMIT = 1;
