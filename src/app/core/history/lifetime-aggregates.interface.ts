/** One whole minute of 5 km results: minute 24 collects every 24:00–24:59 finish. */
export interface MinuteBucket {
  minute: number;
  count: number;
}

/** One year's mean 5 km pace. */
export interface YearPace {
  year: string;
  /** The year's mean 5 km time converted to milliseconds per kilometre. */
  paceMsPerKm: number;
}

/** «Цифры за всё время»: the athlete's lifetime totals and distributions. */
export interface LifetimeAggregates {
  /** Every finish of both distances summed — the lifetime spent on the course. */
  totalTimeMs: number;
  /** Lifetime kilometres with one decimal; the 2,3 km laps count too. */
  totalKm: number;
  /** The 5 km results histogram from the fastest to the slowest minute; gaps stay as zero-count buckets. */
  minuteBuckets: MinuteBucket[];
  /** The mean 5 km pace per year, oldest year first. */
  yearPaces: YearPace[];
}
