import { YearBadgeType } from './year-badges.enum';

/** Badge → the share of participants owning it, in whole percents; a badge nobody earned is absent. */
export type YearBadgeRarity = Partial<Record<YearBadgeType, number>>;
