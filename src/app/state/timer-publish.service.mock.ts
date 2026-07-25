import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { PublishEventInput } from '../core/github/publish-event.interface';
import { TimerPublishState, TimerPublishStateType } from '../core/timer/timer-session.enum';
import { TIMER_SESSION_DATE_ISO } from '../core/timer/timer-session.mock';
import { RACE_EVENT } from './protocol-state.service.mock';
import { TimerPublishStep, TimerPublishStepType } from './timer-publish.enum';

/** The mocked surface: every signal stays writable, so a card spec can be put into any state. */
export interface TimerPublishServiceMock {
  state: WritableSignal<TimerPublishStateType>;
  step: WritableSignal<TimerPublishStepType>;
  error: WritableSignal<string | null>;
  publishedSlug: WritableSignal<string | null>;
  publish: Mock;
  reset: Mock;
}

/** Drop-in `TimerPublishService`: nothing is committed, the steps are driven by the spec. */
export function timerPublishServiceMock(): TimerPublishServiceMock {
  return {
    state: signal<TimerPublishStateType>(TimerPublishState.local),
    step: signal<TimerPublishStepType>(TimerPublishStep.idle),
    error: signal<string | null>(null),
    publishedSlug: signal<string | null>(null),
    publish: vi.fn(() => Promise.resolve()),
    reset: vi.fn(),
  };
}

/** The archive slug a published measurement gets — the race date it was timed on. */
export const TIMER_PUBLISHED_SLUG = TIMER_SESSION_DATE_ISO;

/** A failure sentence as the service stores it; the card shows it verbatim. */
export const TIMER_PUBLISH_ERROR_TEXT = 'Не удалось отправить забег. Замер цел, ничего не потеряно.';

/** What the store hands back for the timed race: the auto-filled requisites, no `source.xlsx`. */
export const TIMER_PUBLISH_INPUTS: PublishEventInput[] = [
  { event: { ...RACE_EVENT, dateIso: TIMER_SESSION_DATE_ISO }, rows: [], sourceXlsxBytes: null },
];

/** The data commit the publication pins its reads to — the sha stored on the session. */
export const TIMER_PUBLISH_REF = 'dddddddddddddddddddddddddddddddddddddddd';

/** «Now» while a publication is timed; the deploy lands a minute later. */
export const TIMER_PUBLISH_STARTED_AT_MS = 1_785_045_600_000;
export const TIMER_PUBLISH_DEPLOY_MS = 60_000;

/** The archive read failing — the offline branch of «Сохранить». */
export const TIMER_PUBLISH_HISTORY_ERROR = new Error('archive unreachable');
