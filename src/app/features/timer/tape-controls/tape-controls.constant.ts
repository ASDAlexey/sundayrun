import { TimerRunnerStage, TimerRunnerStageType } from '../../../core/timer/timer-session.enum';
import { TimerTapeMode, TimerTapeModeType } from './tape-controls.enum';

/** The head of the queue: the chip a tapped surname takes when nothing was picked by hand. */
export const TIMER_TAPE_NEXT_INDEX = 0;

/** Nobody has asked for the handout panel yet — the resting value of `openRequest`. */
export const TIMER_TAPE_NO_REQUEST = 0;

/** An empty half of the handout: nobody in the roster is waiting for this kind of a time. */
export const TIMER_TAPE_NOBODY_WAITING = 0;

/** Whom each half of the handout is about — the one place the two are tied together. */
export const STAGE_OF_MODE: Readonly<Record<TimerTapeModeType, TimerRunnerStageType>> = {
  [TimerTapeMode.lap]: TimerRunnerStage.waitingLap,
  [TimerTapeMode.finish]: TimerRunnerStage.waitingFinish,
};
