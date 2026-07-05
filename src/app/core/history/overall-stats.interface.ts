/**
 * Site-wide totals shown on the landing page; averages are raw numbers, formatting is the
 * view's job. `averageTimeMs` is computed over 5 km runs only.
 */
export interface OverallStats {
  eventsCount: number;
  finishesCount: number;
  finishersCount: number;
  averageFinishes: number;
  averageTimeMs: number;
}
