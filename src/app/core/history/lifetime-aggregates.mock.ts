import { AthleteRun } from '../models/athlete-history.interface';
import { LifetimeAggregates } from './lifetime-aggregates.interface';

const LIFETIME_SLUG = 'lifetime-race';

/** Two 5 km seasons around one short-course lap; the 25th minute is skipped on purpose. */
export const LIFETIME_RUNS: readonly AthleteRun[] = [
  { dateIso: '2024-01-07', slug: LIFETIME_SLUG, timeMs: 1_470_000, distanceKm: 5 },
  { dateIso: '2024-02-04', slug: LIFETIME_SLUG, timeMs: 1_570_000, distanceKm: 5 },
  { dateIso: '2024-03-03', slug: LIFETIME_SLUG, timeMs: 660_000, distanceKm: 2.3 },
  { dateIso: '2025-01-05', slug: LIFETIME_SLUG, timeMs: 1_490_000, distanceKm: 5 },
];

export const EXPECTED_LIFETIME_AGGREGATES: LifetimeAggregates = {
  totalTimeMs: 5_190_000,
  totalKm: 17.3,
  minuteBuckets: [
    { minute: 24, count: 2 },
    { minute: 25, count: 0 },
    { minute: 26, count: 1 },
  ],
  yearPaces: [
    { year: '2024', paceMsPerKm: 304_000 },
    { year: '2025', paceMsPerKm: 298_000 },
  ],
};

/** A history of nothing but short-course laps keeps both 5 km blocks empty. */
export const SHORT_ONLY_RUNS: readonly AthleteRun[] = [{ dateIso: '2024-03-03', slug: LIFETIME_SLUG, timeMs: 660_000, distanceKm: 2.3 }];

export const EXPECTED_SHORT_ONLY_AGGREGATES: LifetimeAggregates = {
  totalTimeMs: 660_000,
  totalKm: 2.3,
  minuteBuckets: [],
  yearPaces: [],
};

export const EMPTY_LIFETIME_AGGREGATES: LifetimeAggregates = {
  totalTimeMs: 0,
  totalKm: 0,
  minuteBuckets: [],
  yearPaces: [],
};
