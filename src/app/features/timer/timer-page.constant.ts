import { TimerTabType } from './timer-page.enum';
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

/**
 * The three tabs and the one area they all point at have to name each other for `aria-controls` and
 * `aria-labelledby` to mean anything, and the page is the only screen on the route — so a fixed id
 * apiece is enough and there is no instance counter to invent.
 */
export const TIMER_PANEL_ID = 'timer-panel';

export const TIMER_TAB_IDS: Readonly<Record<TimerTabType, string>> = {
  finish: 'timer-tab-finish',
  grid: 'timer-tab-grid',
  lap: 'timer-tab-lap',
};
