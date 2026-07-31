import { assignNextUnnamed } from './session-actions';
import { runnerSplits, unassignedSplits } from './session-splits';
import { NOTHING_RECORDED, SOLE_LAP_CANDIDATE } from './timer-session.constant';
import { TimerRunnerOutcome } from './timer-session.enum';
import { TimerRunner, TimerSession } from './timer-session.interface';

/**
 * «Круг в приоритете»: while anybody is still out on the 2.3 km, a time in the nameless queue is
 * somebody's lap — that is already how «круг 3 из 3» counts it (`lapDoneCount`). So when exactly one
 * active runner has not been tapped at all, the earliest queued time has exactly one honest owner,
 * and asking for a surname is ceremony: there is nobody else to name.
 *
 * The rule is deliberately narrow. Two people still out on the lap is a question the organiser has to
 * answer, and a queue with no lap-waiter left is a queue of finishes, which «Разобрать финиш» owns.
 * A guess is possible — the tap may have been the leader's finish rather than the last man's lap — so
 * it stays as undoable as any other split: «Отменить» takes it back, the runner card moves it.
 *
 * Applied after a tap is recorded, never after one is taken back: undo that instantly handed the same
 * time straight back would make the gesture impossible to perform.
 */
export function handOutSoleLapSplit(session: TimerSession): TimerSession {
  const waiting = lapWaiters(session);

  if (waiting.length !== SOLE_LAP_CANDIDATE || unassignedSplits(session).length === NOTHING_RECORDED) {
    return session;
  }

  return assignNextUnnamed(session, waiting[0].id);
}

/** Active runners with no tap at all against them — the people the lap is still waiting on. */
function lapWaiters(session: TimerSession): TimerRunner[] {
  return session.runners.filter(
    (runner) => runner.outcome === TimerRunnerOutcome.active && runnerSplits(session, runner.id).length === NOTHING_RECORDED,
  );
}
