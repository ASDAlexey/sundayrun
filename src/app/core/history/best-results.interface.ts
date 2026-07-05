/** One leaderboard row: an athlete's all-time 5 km best and the run where it was set. */
export interface BestResult {
  key: string;
  displayName: string;
  bestMs: number;
  dateIso: string;
  slug: string;
}
