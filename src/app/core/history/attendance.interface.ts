import { GenderType } from '../models/gender.enum';
import { SeasonType } from './seasons.enum';

/**
 * One row of the «Кто чаще всех» board: the athlete's 5 km finishes inside the chosen scope.
 * `place` is a competition rank — an equal count shares one place and the next count skips ahead,
 * so three athletes on twelve finishes all wear gold.
 */
export interface AttendanceRow {
  key: string;
  displayName: string;
  /** Null while the archive knows no gender for the athlete; the gender filter then hides the row. */
  gender: GenderType | null;
  place: number;
  finishes: number;
  /** The newest scoped finish — the row's «последний старт» link. */
  lastDateIso: string;
  lastSlug: string;
}

/** One season's podium: everyone the season board placed 1–3, ties included. */
export interface SeasonAttendance {
  season: SeasonType;
  rows: AttendanceRow[];
}
