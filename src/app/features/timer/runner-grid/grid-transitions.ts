import { removeSplit } from '../../../core/timer/session-actions';
import { runnerSplitTimesMs, runnerSplits } from '../../../core/timer/session-splits';
import { LAP_DONE_MIN_SPLITS, LAST_ENTRY_INDEX } from '../../../core/timer/timer-session.constant';
import { TimerRunnerOutcome, TimerRunnerOutcomeType } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';

/**
 * The two gestures of a tile that need the session to answer a question about itself. Both are pure
 * and both are handed to `updateActive` as the change callback, so the grid never has to read the
 * store, decide, and write it back — a habit that would let a tap slip in between the two steps.
 */

/**
 * Takes the runner's newest time back — the swipe-right rollback and the «вернуть из полки» tap.
 * A runner with nothing recorded keeps the session reference, so no storage write happens.
 */
export function removeNewestSplit(session: TimerSession, runnerId: string): TimerSession {
  const newest = runnerSplits(session, runnerId).at(LAST_ENTRY_INDEX);

  return newest === undefined ? session : removeSplit(session, newest.id);
}

/**
 * What «сошёл» means for this runner: somebody who already has a 2.3 km time stopped after the lap
 * and keeps it, somebody who has nothing recorded is a plain DNF.
 */
export function retireOutcome(session: TimerSession, runnerId: string): TimerRunnerOutcomeType {
  return runnerSplitTimesMs(session, runnerId).length >= LAP_DONE_MIN_SPLITS ? TimerRunnerOutcome.lapOnly : TimerRunnerOutcome.dnf;
}
