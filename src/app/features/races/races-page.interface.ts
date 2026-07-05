/** One race row prepared for the template: a preformatted date, the online protocol route and a resolved CDN pdf url. */
export interface RaceListItem {
  slug: string;
  protocolLink: string[];
  number: number;
  dateLong: string;
  city: string;
  park: string;
  participantCount: number;
  pdfUrl: string;
  pdfAriaLabel: string;
}
