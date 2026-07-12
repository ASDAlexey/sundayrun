/** One preformatted stat chip on a race card; chips with no value are simply not built. */
export interface RaceCardStat {
  label: string;
  value: string;
}

/** One race row prepared for the template: a preformatted date, the online protocol route and the pdf button label. */
export interface RaceListItem {
  slug: string;
  protocolLink: string[];
  number: number;
  dateLong: string;
  city: string;
  park: string;
  participantCount: number;
  stats: RaceCardStat[];
  pdfAriaLabel: string;
}

/** One season section of the archive: a year divider («2026 · 8 забегов») over its cards. */
export interface RaceYearGroup {
  year: string;
  countText: string;
  races: RaceListItem[];
}
