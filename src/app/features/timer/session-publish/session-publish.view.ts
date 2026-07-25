import { TimerPublishStepType } from '../../../state/timer-publish.enum';
import { TIMER_PUBLISH_STEP_ORDER } from './session-publish.constant';
import { TimerPublishStepView } from './session-publish.interface';

/**
 * Places one step against the flow's current one. Order is the only thing that matters: a step
 * before the current one is `done` (green), the current one is `active` (accent), the rest stay
 * muted. A settled flow (`idle`, `failed`) is not in the list at all, so its position of −1 sits
 * below every step and lights nothing up; `done` is last and marks them all as passed.
 */
export function buildStepView(current: TimerPublishStepType, step: TimerPublishStepType): TimerPublishStepView {
  const currentIndex = TIMER_PUBLISH_STEP_ORDER.indexOf(current);
  const stepIndex = TIMER_PUBLISH_STEP_ORDER.indexOf(step);

  return { active: currentIndex === stepIndex, done: currentIndex > stepIndex };
}
