import { TimerStatus } from '../../core/timer/timer-session.enum';
import { TimerSession, TimerSplit } from '../../core/timer/timer-session.interface';
import { GRID_PLAIN_LAP_SPLIT, GRID_PLAIN_RUNNING } from './runner-grid/runner-grid.mock';
import { TimerHeaderView } from './timer-page.interface';

/** The header of the running fixture: six through the lap, three home, seven on the roster. */
export const TIMER_HEADER_RUNNING: TimerHeaderView = {
  dateText: 'вс · 26 июл 2026',
  finishCount: 4,
  lapCount: 7,
  runnerCount: 7,
  undoArmed: true,
};

/** The tail of the farewell line: Троилин's 1 406 000 ms, as the clock prints them. */
export const FAREWELL_BEST_TEXT = '23:26,00';

export const PAGE_UNNAMED_SPLIT_ID = 'split-page-unnamed';

/** «Отсечка без имени» pressed once while the pack came through the lap. */
const PAGE_UNNAMED_SPLIT: TimerSplit = { id: PAGE_UNNAMED_SPLIT_ID, atMs: 1_450_000, runnerId: null };

/** The plain three-runner race with one time still waiting for a name — the handout to walk through. */
export const TIMER_PAGE_QUEUE: TimerSession = {
  ...GRID_PLAIN_RUNNING,
  splits: [GRID_PLAIN_LAP_SPLIT, PAGE_UNNAMED_SPLIT],
};

/** The same race after «Стоп». Everybody here has a gender, so «Сохранить» is not blocked. */
export const TIMER_PAGE_FINISHED: TimerSession = {
  ...TIMER_PAGE_QUEUE,
  stoppedAtMs: 1_800_000,
  status: TimerStatus.finished,
};

/** The same stopped race with the queue handed out — nothing holds «Сохранить» any more. */
export const TIMER_PAGE_SAVED: TimerSession = { ...TIMER_PAGE_FINISHED, splits: [GRID_PLAIN_LAP_SPLIT] };

/** What «Сбросить забег?» says about the fixture race — the times go, the people stay. */
export const TIMER_RESET_NOTE = 'Времена сотрутся — 11 отсечек. Состав останется: 7 участников, можно бежать заново.';
