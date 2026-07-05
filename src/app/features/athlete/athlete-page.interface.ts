import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { AthleteStatusType } from './athlete-page.enum';

/** The resolved page state for one athlete key, applied atomically after the load settles. */
export interface AthletePageState {
  status: AthleteStatusType;
  record: AthleteRecord | null;
}

/** One run prepared for the template: a preformatted date/time and a resolved protocol link. */
export interface AthleteRunView {
  slug: string;
  raceLink: string[];
  dateShort: string;
  distanceText: string;
  timeText: string;
}

/** One year's best prepared for the template. */
export interface YearBestView {
  year: string;
  timeText: string;
}
