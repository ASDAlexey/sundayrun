import { GenderType } from '../models/gender.enum';
import { YearBadgeType } from './year-badges.enum';

/** One finished run of the year joined with its athlete, the raw material of the review. */
export interface YearRunRow {
  key: string;
  displayName: string;
  gender: GenderType | null;
  dateIso: string;
  slug: string;
  timeMs: number;
  distanceKm: number;
}

/** Everything the review builder needs about one year, fetched in a handful of selects. */
export interface YearReviewSource {
  year: string;
  /** The year's event dates (slugs), ascending — the first one is the new-year race. */
  eventDates: string[];
  runRows: YearRunRow[];
  newcomerCount: number;
  personalRecordCount: number;
}

/** One row of the year's best-results board: an athlete's fastest 5 km of the season. */
export interface YearBestResult {
  key: string;
  displayName: string;
  timeMs: number;
  dateIso: string;
  slug: string;
}

export interface YearActiveAthlete {
  key: string;
  displayName: string;
  finishCount: number;
}

export interface YearBadgeHolder {
  key: string;
  displayName: string;
}

export interface YearBadgeHolders {
  badge: YearBadgeType;
  holders: YearBadgeHolder[];
}

/** The «Итоги года» page payload, fully derived from `YearReviewSource`. */
export interface YearReview {
  year: string;
  eventCount: number;
  finishCount: number;
  finisherCount: number;
  newcomerCount: number;
  personalRecordCount: number;
  medianTimeMenMs: number | null;
  medianTimeWomenMs: number | null;
  /** Top-10 season bests per gender, one row per athlete, ranked like the records boards. */
  bestMen: YearBestResult[];
  bestWomen: YearBestResult[];
  mostActive: YearActiveAthlete[];
  /** Badge → athletes, display order; badges nobody earned are omitted. */
  badgeHolders: YearBadgeHolders[];
  firstEventSlug: string | null;
}
