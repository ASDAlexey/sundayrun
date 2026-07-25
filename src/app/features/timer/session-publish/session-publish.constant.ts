import { TIMER_PAGE_LINK } from '../../../app.constant';
import { TimerPublishStep, TimerPublishStepType } from '../../../state/timer-publish.enum';
import { ADMIN_RETURN_PARAM } from '../../admin/admin-page.constant';

/** The steps in the order the flow walks them; `buildStepView` compares positions in this list. */
export const TIMER_PUBLISH_STEP_ORDER: TimerPublishStepType[] = [
  TimerPublishStep.notes,
  TimerPublishStep.committing,
  TimerPublishStep.deploying,
  TimerPublishStep.done,
];

/** routerLink of the fallback route: the draft is already in the store, so «Проверить» costs a navigation. */
export const PREVIEW_PAGE_LINK = '/preview';

/**
 * «Я организатор — опубликовать» sends the guest to the key form and back again, so the measurement
 * is published from the very screen it was timed on (docs/TIMER.md §9).
 */
export const TIMER_ADMIN_RETURN_PARAMS: Record<string, string> = { [ADMIN_RETURN_PARAM]: TIMER_PAGE_LINK };

/** Nothing is waiting for a name / everybody's gender is known — the two counters at rest. */
export const TIMER_PUBLISH_NOTHING = 0;
