/** One year's best 5 km time, flattened from `AthleteRecord.bestMsByYear` with the race slug. */
export interface YearBestEntry {
  year: string;
  timeMs: number;
  slug: string;
}
