import { TimerRunnerStageType } from '../../../core/timer/timer-session.enum';
import { TimerRunner } from '../../../core/timer/timer-session.interface';

/** Everything one tile renders — the grid computes it, the tile only draws it. */
export interface TimerTileView {
  /** 1…15, the `--chart-N` ink picked by the name hash. */
  accentIndex: number;
  givenName: string;
  runner: TimerRunner;
  stage: TimerRunnerStageType;
  surname: string;
  timeText: string;
}

/** The two halves of a full name as the tile shows them. */
export interface TimerTileName {
  givenName: string;
  surname: string;
}

/** What the tile order is derived from; `frozen` closes it for the rest of the race. */
export interface TimerTileOrderSource {
  expectedLapMs: ReadonlyMap<string, number>;
  frozen: boolean;
  runners: readonly TimerRunner[];
}

/**
 * The newest tap. It buys the grid two things: the shelf waits for a few seconds of silence before
 * anything moves under the finger, and a swipe-right undo announces the time it has just taken back
 * even when the tile is already showing the next one.
 */
export interface TimerLastTap {
  atMs: number;
  runnerId: string;
}

/**
 * The split the newest tap actually wrote down, if it wrote one. Deliberately not folded into
 * `TimerLastTap`: that one has to survive a rollback — the shelf keeps waiting out its three quiet
 * seconds after a swipe-right, and the undo still announces the time it took back — while this one
 * is a one-shot receipt that every path which removes the split has to tear up at once, or a second
 * removal would land on somebody else's time.
 */
export interface TimerLastSplit {
  runnerId: string;
  splitId: string;
}
