/** One athlete row prepared for the template: preformatted best time and a resolved personal link. */
export interface AthleteListItem {
  key: string;
  link: string[];
  displayName: string;
  participationCount: number;
  bestTimeText: string;
}
