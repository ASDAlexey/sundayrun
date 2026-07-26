/**
 * The overall statistics block prepared for the template. Every displayed value is a
 * formatted string; the three raw counts ride along only so the count-up knows where it
 * is heading — the string stays what actually renders.
 */
export interface HomeStatsView {
  events: string;
  eventsCount: number;
  finishes: string;
  finishesCount: number;
  finishers: string;
  finishersCount: number;
  averageFinishes: string;
  medianTimeMen: string;
  medianTimeWomen: string;
}

/** The personal card for the picked self («Выбери себя»); null until the pick and its history load. */
export interface HomeSelfView {
  displayName: string;
  athleteLink: string[];
  finishesText: string;
  bestTimeText: string;
  /** Current weekly streak — consecutive latest events with a participation. */
  streakText: string;
  /** 5 km finishes and the best time within the current calendar year. */
  finishesYearText: string;
  bestTimeYearText: string;
}
