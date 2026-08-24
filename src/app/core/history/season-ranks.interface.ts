import { type GenderType } from '../models/gender.enum';
import { type SeasonType } from './seasons.enum';

/** One athlete's best 5 km time of one season — a lane in the season's gendered ranking table. */
export interface SeasonBestRow {
  athleteKey: string;
  gender: GenderType;
  year: string;
  season: SeasonType;
  bestMs: number;
}
