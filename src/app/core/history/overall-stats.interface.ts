/**
 * Site-wide totals shown on the landing page; numbers are raw, formatting is the
 * view's job. The median times are computed over 5 km runs only, separately per gender;
 * athletes with an unknown gender contribute to neither median. A zero means the gender
 * has no 5 km finishes yet.
 */
export interface OverallStats {
  eventsCount: number;
  finishesCount: number;
  finishersCount: number;
  averageFinishes: number;
  medianTimeMenMs: number;
  medianTimeWomenMs: number;
}
