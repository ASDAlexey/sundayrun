/** One preformatted stat chip on a race card; chips with no value are simply not built. */
export interface RaceCardStat {
  label: string;
  value: string;
}

/** One race row prepared for the template: a preformatted date, the online protocol route and the pdf button label. */
export interface RaceListItem {
  slug: string;
  protocolLink: string[];
  /** Preformatted: '249 (2.72)' when the organisers' legacy number is known, plain '249' otherwise. */
  number: string;
  dateLong: string;
  city: string;
  park: string;
  participantCount: number;
  /** True for the month-final («итоговый») race — the card gets the accent badge and outline. */
  isMonthFinal: boolean;
  stats: RaceCardStat[];
  pdfAriaLabel: string;
}

/** One season section of the archive: a year divider («2026 · 8 забегов») over its cards. */
export interface RaceYearGroup {
  year: string;
  countText: string;
  races: RaceListItem[];
}
