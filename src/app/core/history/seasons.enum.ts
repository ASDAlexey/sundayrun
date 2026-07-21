/**
 * Calendar-year seasons: a year's winter is its own January, February and December, so every
 * season lives inside one year and lines up with the year filters and the per-year badge rows.
 */
export const Season = {
  winter: 'winter',
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
} as const;

export type SeasonType = (typeof Season)[keyof typeof Season];
