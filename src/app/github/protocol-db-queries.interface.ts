import { GenderType } from '../core/models/gender.enum';

/** The `athletes` columns the pages read, camelCased by the statement's aliases. */
export interface AthleteSqlRow {
  key: string;
  displayName: string;
  gender: GenderType | null;
  bestMs: number | null;
}

/** One season best: the fastest 5 km run of `athleteKey` in the `dateIso` year. */
export interface YearBestSqlRow {
  athleteKey: string;
  dateIso: string;
  slug: string;
  timeMs: number;
}

export interface ParticipationSqlRow {
  slug: string;
}

export interface OverallCountsSqlRow {
  eventsCount: number;
  finishesCount: number;
  finishersCount: number;
}

/** Null when the gender has no finished 5 km runs — `AVG` over an empty sample. */
export interface MedianTimeSqlRow {
  medianMs: number | null;
}
