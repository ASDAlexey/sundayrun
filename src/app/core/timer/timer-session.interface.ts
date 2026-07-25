import { GenderType } from '../models/gender.enum';
import { TimerPublishStateType, TimerRoleType, TimerRunnerOutcomeType, TimerStatusType } from './timer-session.enum';

/** One recorded tap. `runnerId` is null while the time waits in the unnamed queue (docs/TIMER.md §4). */
export interface TimerSplit {
  id: string;
  /** Milliseconds from the mass start; monotonic, never negative. */
  atMs: number;
  runnerId: string | null;
}

export interface TimerRunner {
  id: string;
  fullName: string;
  /** Normalized archive key when the person came from the directory, null for a newcomer. */
  athleteKey: string | null;
  gender: GenderType | null;
  outcome: TimerRunnerOutcomeType;
}

export interface TimerPublishStatus {
  state: TimerPublishStateType;
  error: string | null;
  sha: string | null;
}

export interface TimerSession {
  id: string;
  /** Race date, 'YYYY-MM-DD'. */
  dateIso: string;
  createdAtMs: number;
  /** Epoch ms of the mass start — the date anchor, never used in split arithmetic. */
  startedAtEpochMs: number | null;
  /** Elapsed ms captured when the clock was stopped; null while it still runs. */
  stoppedAtMs: number | null;
  status: TimerStatusType;
  role: TimerRoleType;
  runners: TimerRunner[];
  /** Append-only journal of every tap — the single source of truth for times and undo. */
  splits: TimerSplit[];
  publish: TimerPublishStatus;
}
