/** Metadata of a single race event; `dateIso` is 'YYYY-MM-DD'. */
export interface RaceEvent {
  number: number;
  /** The organisers' pre-positional number ('160' or '2.72'), read back from the archive; null for new events. */
  legacyNumber: string | null;
  dateIso: string;
  city: string;
  park: string;
  clubName: string;
  chairman: string;
}
