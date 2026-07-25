import { TimerSession } from '../../../core/timer/timer-session.interface';
import { TIMER_SESSION_IDLE } from '../../../core/timer/timer-session.mock';

/** What the fixture race adds up to: six through the lap, three home, seven on the roster. */
export const CLOCK_LAP_COUNT = 6;
export const CLOCK_FINISH_COUNT = 3;
export const CLOCK_TOTAL_COUNT = 7;

/** The digits the stubbed clock stands at, and the figure they have to spell. */
export const CLOCK_ELAPSED_MS = 767_300;
export const CLOCK_FIGURE_TEXT = '12:47';

/** The hundredths riding beside them, and the whole readout as the span reads it. */
export const CLOCK_FRACTION_TEXT = ',30';
export const CLOCK_READOUT_TEXT = `${CLOCK_FIGURE_TEXT}${CLOCK_FRACTION_TEXT}`;

/** The wall clock the mass start is stamped with — frozen, so the assertion can name it. */
export const CLOCK_START_EPOCH_MS = 1_785_045_600_000;

/** The tail of the farewell line — Троилин's finish, printed the way the boards print it. */
export const CLOCK_SUMMARY_BEST_TEXT = '23:26';

/** An empty screen shows zeros, and a bar with nothing to fill stays at nought. */
export const CLOCK_EMPTY_COUNT_TEXT = '0';
export const CLOCK_EMPTY_PROGRESS = '0';

/** The measurement nobody has been added to yet — «Старт» has nothing to time. */
export const CLOCK_EMPTY_SESSION: TimerSession = { ...TIMER_SESSION_IDLE, runners: [], splits: [] };
