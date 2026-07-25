import { TimerHeaderView } from './timer-page.interface';

/** Nothing is open, so there is nothing to mark, count or undo. */
export const TIMER_HEADER_EMPTY: TimerHeaderView = {
  dateText: '',
  finishCount: 0,
  lapCount: 0,
  runnerCount: 0,
  undoArmed: false,
};

/** Nobody has asked for the handout panel yet; every «Разобрать» raises this by one. */
export const TIMER_FIRST_QUEUE_REQUEST = 0;
