import { RaceStatusType } from './race-page.enum';

/** One protocol row prepared for the template: preformatted cells and a resolved athlete link. */
export interface RaceRowView {
  index: number;
  fullName: string;
  athleteLink: string[];
  athleteAriaLabel: string;
  time23: string;
  time5: string;
  paceText: string;
  genderText: string;
  placeMText: string;
  placeFText: string;
  club: string;
  note: string;
}

/** The resolved page state for one slug, applied atomically after the load settles. */
export interface RacePageState {
  status: RaceStatusType;
  race: RaceView | null;
}

/**
 * The whole protocol prepared for the template: event header, pdf button label and the rows.
 * `avgTimeM`/`avgTimeF` average the 5 km times per gender, `null` when no such finishers.
 */
export interface RaceView {
  number: number;
  dateLong: string;
  city: string;
  park: string;
  participantCount: number;
  avgTimeM: string | null;
  avgTimeF: string | null;
  pdfAriaLabel: string;
  rows: RaceRowView[];
}
