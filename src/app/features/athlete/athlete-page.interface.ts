import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { AthleteStatusType } from './athlete-page.enum';

/** The resolved page state for one athlete key, applied atomically after the load settles. */
export interface AthletePageState {
  status: AthleteStatusType;
  record: AthleteRecord | null;
  /** A year mapped to the archive's first race date of that year, feeding `athleteYearBadges`. */
  firstEventDateByYear: Record<string, string>;
  /** Every event slug oldest first, feeding `athleteStreaks`. */
  eventSlugs: string[];
}

/** The streaks card prepared for the template: pluralized week counts and the «Раж» tally. */
export interface StreaksView {
  /** «3 недели» — consecutive events counting back from the latest one. */
  currentText: string;
  /** «7 недель» — the longest run of consecutive events. */
  maxText: string;
  /** How many times three 5 km personal records landed in a row; 0 hides the line. */
  rageCount: number;
}

/** One run prepared for the template: a preformatted date/time and a resolved protocol link. */
export interface AthleteRunView {
  slug: string;
  raceLink: string[];
  dateShort: string;
  timeText: string;
}

/** One year's best prepared for the template. */
export interface YearBestView {
  year: string;
  timeText: string;
}
