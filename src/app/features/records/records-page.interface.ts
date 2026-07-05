/** One leaderboard row prepared for the template: place, links and preformatted values. */
export interface BestResultView {
  place: number;
  key: string;
  athleteLink: string[];
  displayName: string;
  timeText: string;
  dateShort: string;
  raceLink: string[];
}
