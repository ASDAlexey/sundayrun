import { GenderType } from '../models/gender.enum';

/** One 5 km season finish feeding the standings scan: who ran, when and how fast. */
export interface SeasonRun {
  key: string;
  displayName: string;
  gender: GenderType | null;
  dateIso: string;
  timeMs: number;
}

/** One standings snapshot cell: the position after an event and the season best behind it. */
export interface SeasonPositionPoint {
  position: number;
  bestMs: number;
}

/** One athlete's standings trajectory: the point after each event, null before the debut. */
export interface SeasonPositionLine {
  key: string;
  displayName: string;
  points: (SeasonPositionPoint | null)[];
}

/**
 * The bump chart source for one gender: the season's event dates, every ranked athlete's
 * position line (final standings order), and how many athletes the final standings rank.
 */
export interface SeasonPositions {
  eventDates: string[];
  lines: SeasonPositionLine[];
  rankedCount: number;
}
