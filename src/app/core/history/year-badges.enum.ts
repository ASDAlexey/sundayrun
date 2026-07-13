/**
 * Yearly achievement badges, obsessive tiers first (only the highest earned tier is awarded).
 * The ranking family (`courseKing` and the `year*` cuts) is transferable: the current season
 * recomputes on every visit, so a badge earned in the running year can still slip away, while
 * the finished years never change. `courseKing` belongs to the standing course record holder only.
 */
export const YearBadge = {
  obsessiveGold: 'obsessiveGold',
  obsessiveSilver: 'obsessiveSilver',
  obsessiveBronze: 'obsessiveBronze',
  allMonths: 'allMonths',
  newYearRace: 'newYearRace',
  courseKing: 'courseKing',
  yearKing: 'yearKing',
  yearPodium: 'yearPodium',
  yearTopTen: 'yearTopTen',
  yearTopThirty: 'yearTopThirty',
} as const;

export type YearBadgeType = (typeof YearBadge)[keyof typeof YearBadge];
