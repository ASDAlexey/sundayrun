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
  /** «Каким по счёту» — the athlete's 5 km finish count as of this race; blank for DNF and one-lap rows. */
  finishCountText: string;
  club: string;
  note: string;
  /** Preformatted on-the-fly notable («2-й результат за всё время»); empty when nothing stands out. */
  notableText: string;
}

/** The resolved page state for one slug, applied atomically after the load settles. */
export interface RacePageState {
  status: RaceStatusType;
  race: RaceView | null;
}

/**
 * The whole protocol prepared for the template: event header, pdf button label and the rows.
 * `medianTimeM`/`medianTimeF` average the 5 km times per gender, `null` when no such finishers.
 */
export interface RaceView {
  /** Preformatted: '249 (2.72)' when the organisers' legacy number is known, plain '249' otherwise. */
  number: string;
  dateLong: string;
  city: string;
  park: string;
  participantCount: number;
  /** Preformatted parkrun-style line: «8 финишёров, 2 новичка, 3 личных рекорда». */
  summaryText: string;
  medianTimeM: string | null;
  medianTimeF: string | null;
  /** True for the month-final («итоговый») race — the header gets the accent badge. */
  isMonthFinal: boolean;
  pdfAriaLabel: string;
  rows: RaceRowView[];
}
