export const RecordsStatus = {
  loading: 'loading',
  ready: 'ready',
  empty: 'empty',
  error: 'error',
} as const;

export type RecordsStatusType = (typeof RecordsStatus)[keyof typeof RecordsStatus];

export const RecordsView = {
  table: 'table',
  chart: 'chart',
  rating: 'rating',
} as const;

export type RecordsViewType = (typeof RecordsView)[keyof typeof RecordsView];

/** What the season chart ranks: the full 5 km times or the first-lap (2.3 km) splits. */
export const SeasonMetric = {
  fiveKm: 'fiveKm',
  firstLap: 'firstLap',
} as const;

export type SeasonMetricType = (typeof SeasonMetric)[keyof typeof SeasonMetric];
