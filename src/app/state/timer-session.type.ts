import { TimerSession } from '../core/timer/timer-session.interface';

/**
 * A pure core transition as the service takes it: session in, session out. Returning the very same
 * reference means «change refused» — the service then skips both the signal and the write.
 */
export type TimerSessionChange = (session: TimerSession) => TimerSession;

/**
 * A measurement as localStorage may hold it. The tile order arrived later than the rest of the model
 * and is the one field an older release never wrote: it is filled in on read rather than demanded,
 * because dropping a race for the want of a display order would cost the times themselves.
 */
export type StoredTimerSession = Omit<TimerSession, 'tileOrder'> & { tileOrder?: string[] };
