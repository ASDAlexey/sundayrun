import { TimerRunnerStage, TimerRunnerStageType } from '../../../core/timer/timer-session.enum';
import { TimerTapeMode, TimerTapeModeType } from './tape-controls.enum';

/** Nobody has asked for the handout sheet yet — the resting value of `openRequest`. */
export const TIMER_TAPE_NO_REQUEST = 0;

/** An empty half of the handout: nobody in the roster is waiting for this kind of a time. */
export const TIMER_TAPE_NOBODY_WAITING = 0;

/** One surname left in the open half — serving it is what closes the sheet behind the handout. */
export const TIMER_TAPE_LAST_TARGET = 1;

/** Whom each half of the handout is about — the one place the two are tied together. */
export const STAGE_OF_MODE: Readonly<Record<TimerTapeModeType, TimerRunnerStageType>> = {
  [TimerTapeMode.lap]: TimerRunnerStage.waitingLap,
  [TimerTapeMode.finish]: TimerRunnerStage.waitingFinish,
};
