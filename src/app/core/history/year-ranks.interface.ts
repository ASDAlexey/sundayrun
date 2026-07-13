import { GenderType } from '../models/gender.enum';
import { YearBadgeType } from './year-badges.enum';

/** One athlete's best 5 km time of one year, as selected from the db — a lane in the year's ranking. */
export interface YearBestRow {
  athleteKey: string;
  gender: GenderType;
  year: string;
  bestMs: number;
}

/** One earned ranking badge: where the athlete's best time landed in a year's gender table. */
export interface YearRankedBadge {
  athleteKey: string;
  year: string;
  badge: YearBadgeType;
}
