import { TimerSession } from '../core/timer/timer-session.interface';

/** Everything a new measurement needs from the caller; the id and the clock come from the service. */
export interface CreateTimerSessionInput {
  /** Race date, 'YYYY-MM-DD'. */
  dateIso: string;
}

/** The whole timer state of the device: every measurement plus the one currently open. */
export interface TimerSessionState {
  /** Newest first, so «Мои замеры» renders the list as it stands. */
  sessions: TimerSession[];
  activeId: string | null;
}
