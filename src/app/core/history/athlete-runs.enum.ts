export const RunsSort = {
  byDate: 'byDate',
  byTime: 'byTime',
} as const;

export type RunsSortType = (typeof RunsSort)[keyof typeof RunsSort];
