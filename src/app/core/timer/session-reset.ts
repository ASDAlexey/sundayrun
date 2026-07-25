import { TimerStatus } from './timer-session.enum';
import { TimerSession } from './timer-session.interface';

/**
 * «Сбросить забег»: the roster survives, everything the clock produced does not. The organiser only
 * reaches this through a long press, so it is deliberately total — a session that was reset is
 * indistinguishable from one just assembled. A session with nothing to forget keeps its reference,
 * so the guarded storage write never happens.
 */
export function resetSession(session: TimerSession): TimerSession {
  if (session.status === TimerStatus.idle && session.splits.length === 0) {
    return session;
  }

  return { ...session, startedAtEpochMs: null, stoppedAtMs: null, status: TimerStatus.idle, splits: [] };
}
