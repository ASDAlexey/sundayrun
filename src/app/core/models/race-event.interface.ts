/** Metadata of a single race event; `dateIso` is 'YYYY-MM-DD'. */
export interface RaceEvent {
  number: number;
  dateIso: string;
  city: string;
  park: string;
  clubName: string;
  chairman: string;
}
