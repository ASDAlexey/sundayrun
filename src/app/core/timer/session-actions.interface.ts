import { GenderType } from '../models/gender.enum';
import { TimerRoleType } from './timer-session.enum';

/** Everything a new session needs from the outside — ids and clocks are never invented here. */
export interface CreateSessionInput {
  id: string;
  /** Race date, 'YYYY-MM-DD'. */
  dateIso: string;
  createdAtMs: number;
  /** Defaults to the main judge; the other roles wait for the second-judge UI (docs/TIMER.md §13). */
  role?: TimerRoleType;
}

/** A runner as the roster sheet hands him over: the outcome always starts `active`. */
export interface NewTimerRunner {
  id: string;
  fullName: string;
  athleteKey: string | null;
  gender: GenderType | null;
}
