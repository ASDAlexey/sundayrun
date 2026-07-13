/** The overall statistics block prepared for the template — every value is a formatted string. */
export interface HomeStatsView {
  events: string;
  finishes: string;
  finishers: string;
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
