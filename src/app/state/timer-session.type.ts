import { TimerSession } from '../core/timer/timer-session.interface';

/**
 * A pure core transition as the service takes it: session in, session out. Returning the very same
 * reference means «change refused» — the service then skips both the signal and the write.
 */
export type TimerSessionChange = (session: TimerSession) => TimerSession;
