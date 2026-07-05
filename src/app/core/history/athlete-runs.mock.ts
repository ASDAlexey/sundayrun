import { AthleteRun } from '../models/athlete-history.interface';
import { YearBestEntry } from './athlete-runs.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';

export const RUN_2025_FIVE_KM: AthleteRun = { dateIso: '2025-12-27', slug: '2025-12-27', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM };

export const RUN_2026_SHORT: AthleteRun = {
  dateIso: '2026-01-03',
  slug: '2026-01-03',
  timeMs: 690000,
  distanceKm: TWO_THREE_KM_DISTANCE_KM,
};

export const RUN_2026_FIVE_KM: AthleteRun = { dateIso: '2026-01-10', slug: '2026-01-10', timeMs: 1440000, distanceKm: FIVE_KM_DISTANCE_KM };

/** Deliberately unsorted: two years, both distances. */
export const ATHLETE_RUNS: AthleteRun[] = [RUN_2026_SHORT, RUN_2025_FIVE_KM, RUN_2026_FIVE_KM];

export const FILTER_YEAR = '2026';

export const EXPECTED_RUN_YEARS = ['2026', '2025'];

export const EXPECTED_YEAR_FILTERED: AthleteRun[] = [RUN_2026_SHORT, RUN_2026_FIVE_KM];

export const EXPECTED_DISTANCE_FILTERED: AthleteRun[] = [RUN_2025_FIVE_KM, RUN_2026_FIVE_KM];

export const EXPECTED_BOTH_FILTERED: AthleteRun[] = [RUN_2026_SHORT];

export const EXPECTED_BY_DATE_ORDER: AthleteRun[] = [RUN_2026_FIVE_KM, RUN_2026_SHORT, RUN_2025_FIVE_KM];

export const EXPECTED_BY_TIME_ORDER: AthleteRun[] = [RUN_2026_SHORT, RUN_2026_FIVE_KM, RUN_2025_FIVE_KM];

/** Insertion order is oldest-first to prove the entries get re-sorted. */
export const BEST_MS_BY_YEAR: Record<string, number> = { '2025': 1500000, '2026': 1440000 };

export const EXPECTED_YEAR_BESTS: YearBestEntry[] = [
  { year: '2026', timeMs: 1440000 },
  { year: '2025', timeMs: 1500000 },
];
