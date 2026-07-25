import { GenderType } from '../../../core/models/gender.enum';
import { LapBoardRow } from '../../../core/timer/session-lap-board.interface';
import { TimerRunner } from '../../../core/timer/timer-session.interface';
import { TimerLapMarkType } from './lap-board.enum';

/** One line of the live «Первый круг» table, ready for the template. */
export interface TimerLapRow {
  fullName: string;
  /** «+1:42» to the leader of the lap; empty for the leader himself. */
  gapText: string;
  /** What the archive says about this lap, or null for a newcomer and for anybody without history. */
  mark: TimerLapMarkType | null;
  /** Whether the row had to travel to reach its place — the FLIP move rather than a repaint. */
  moved: boolean;
  /** How many *marked* rows the move crosses; the stylesheet knows what a mark is worth in pixels. */
  noteSteps: number;
  place: number;
  /** How many rows up (negative) or down the line travels; the rows themselves stay in roster order. */
  rowSteps: number;
  runnerId: string;
  timeText: string;
}

/** A board row with its archive mark resolved — what the row heights and the FLIP arithmetic read. */
export interface MarkedLapRow {
  mark: TimerLapMarkType | null;
  row: LapBoardRow;
}

/** Everything the table needs: the lap board from the core plus what the archive knows. */
export interface TimerLapRowsInput {
  bestLapMs: ReadonlyMap<string, number>;
  board: readonly LapBoardRow[];
  courseRecordLapMs: Readonly<Record<GenderType, number | null>>;
  runners: readonly TimerRunner[];
}
