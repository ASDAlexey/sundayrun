/** One preformatted stat chip on a race card; chips with no value are simply not built. */
export interface RaceCardStat {
  label: string;
  value: string;
}

/** One race row prepared for the template: a preformatted date, the online protocol route and a resolved CDN pdf url. */
export interface RaceListItem {
  slug: string;
  protocolLink: string[];
  number: number;
  dateLong: string;
  city: string;
  park: string;
  participantCount: number;
  stats: RaceCardStat[];
  pdfUrl: string;
  pdfAriaLabel: string;
}
