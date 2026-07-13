/** One athlete-year's activity aggregates as selected from the db, feeding the rarity counters. */
export interface YearBadgeActivityRow {
  athleteKey: string;
  year: string;
  /** Finished runs of the year, the short course included. */
  runCount: number;
  /** Distinct months with at least one finished run. */
  monthCount: number;
  /** The athlete's earliest run of the year; equals the year's first race date iff they finished it. */
  firstRunDateIso: string;
  /** The year holds a finish after a three-month break. */
  hasComeback: boolean;
  /** The year's 5 km finishes slower than the athlete's all-time 5 km median. */
  slowFinishCount: number;
}
