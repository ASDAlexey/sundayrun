import { GenderType } from './gender.enum';

/**
 * A formatted protocol row: display strings, empty string when absent.
 * `totalMs`/`distanceKm` are machine-readable: total time in ms and the covered
 * distance (5 for finishers, 2.3 for one-lap runners), both `null` for DNF.
 */
export interface ProtocolRow {
  index: number;
  fullName: string;
  time23: string;
  time5: string;
  totalMs: number | null;
  distanceKm: number | null;
  gender: GenderType | null;
  placeM: number | null;
  placeF: number | null;
  club: string;
  note: string;
}
