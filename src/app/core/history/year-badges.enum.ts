/** Yearly achievement badges, obsessive tiers first (only the highest earned tier is awarded). */
export const YearBadge = {
  obsessiveGold: 'obsessiveGold',
  obsessiveSilver: 'obsessiveSilver',
  obsessiveBronze: 'obsessiveBronze',
  allMonths: 'allMonths',
  newYearRace: 'newYearRace',
} as const;

export type YearBadgeType = (typeof YearBadge)[keyof typeof YearBadge];
