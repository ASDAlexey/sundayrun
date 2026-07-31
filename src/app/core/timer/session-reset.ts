import { EMPTY_ROSTER } from './timer-session.constant';
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

/**
 * «Очистить состав»: the way back out of a line-up assembled wrong — a name misheard, half a club
 * ticked by accident, somebody entered twice. The measurement itself survives with its date and its
 * place in «Мои замеры»; what goes is everybody who was chosen.
 *
 * Before the mass start only, and refused everywhere else rather than in the screen that offers it:
 * mid-race this would delete the whole protocol at one tap, and a rule written in the core cannot be
 * walked around by a second judge's device or a restored session. An empty roster keeps its
 * reference, so the guarded storage write never happens.
 */
export function clearRoster(session: TimerSession): TimerSession {
  if (session.status !== TimerStatus.idle || session.runners.length === EMPTY_ROSTER) {
    return session;
  }

  return { ...session, runners: [], splits: [] };
}
