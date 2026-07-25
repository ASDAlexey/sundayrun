import { Gender } from '../core/models/gender.enum';
import { TimerPublishState, TimerRole, TimerRunnerOutcome, TimerStatus } from '../core/timer/timer-session.enum';

/** Every legal `status` of a stored session; a hand-edited value fails the shape check. */
export const TIMER_STATUS_VALUES: readonly string[] = Object.values(TimerStatus);

/** Every legal judge `role` of a stored session. */
export const TIMER_ROLE_VALUES: readonly string[] = Object.values(TimerRole);

/** Every legal `outcome` of a stored runner. */
export const TIMER_RUNNER_OUTCOME_VALUES: readonly string[] = Object.values(TimerRunnerOutcome);

/** Every legal publish `state` of a stored session. */
export const TIMER_PUBLISH_STATE_VALUES: readonly string[] = Object.values(TimerPublishState);

/** Every legal gender; a stored roster entry carries one of these or nothing at all. */
export const GENDER_VALUES: readonly string[] = Object.values(Gender);
