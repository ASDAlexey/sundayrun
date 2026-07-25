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

/** The newest tap, kept so the next one inside the undo window can take it back. */
export interface TimerLastTap {
  atMs: number;
  runnerId: string;
  splitId: string;
}
