import { formatRussianDateChip } from '../../core/time/russian-date';
import { finishDoneCount, lapDoneCount } from '../../core/timer/session-splits';
import { TimerSession } from '../../core/timer/timer-session.interface';
import { TIMER_HEADER_EMPTY } from './timer-page.constant';
import { TimerHeaderView } from './timer-page.interface';

/**
 * The header of the race screen in one pass. It is a plain function rather than four computed
 * signals so the «нет открытого замера» case is answered once, here, instead of leaking a null check
 * into every counter the template reads.
 */
export function buildTimerHeader(session: TimerSession | null): TimerHeaderView {
  if (session === null) {
    return TIMER_HEADER_EMPTY;
  }

  return {
    dateText: formatRussianDateChip(session.dateIso),
    finishCount: finishDoneCount(session),
    lapCount: lapDoneCount(session),
    runnerCount: session.runners.length,
    undoArmed: session.splits.length > 0,
  };
}
