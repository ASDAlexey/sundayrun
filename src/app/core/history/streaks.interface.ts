/** One athlete's streaks: the weekly loyalty runs plus the S95-style «Раж» tally. */
export interface AthleteStreaks {
  /** Consecutive events participated in counting back from the archive's latest one; 0 after a miss. */
  currentWeeks: number;
  /** The longest run of consecutive events ever participated in. */
  maxWeeks: number;
  /** How many times «Раж» was earned — three 5 km personal records in a row. */
  rageCount: number;
}
