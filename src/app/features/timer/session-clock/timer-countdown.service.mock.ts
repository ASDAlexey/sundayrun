import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

/** The shape `timerCountdownServiceMock` returns: the visible figure plus the two calls it takes. */
export interface TimerCountdownServiceMock {
  cancel: Mock;
  run: Mock;
  value: WritableSignal<number | null>;
}

/** A stubbed ceremony: the spec decides what is on screen and when the launch callback fires. */
export function timerCountdownServiceMock(): TimerCountdownServiceMock {
  return { cancel: vi.fn(), run: vi.fn(), value: signal<number | null>(null) };
}

/** The slice of `DOCUMENT.defaultView` the countdown reads. */
export interface CountdownViewMock {
  clearInterval: Mock;
  matchMedia: Mock;
  setInterval: Mock;
}

/** The handle `setInterval` hands back, so the spec can assert what `clearInterval` was given. */
export const COUNTDOWN_INTERVAL_ID = 7;

export function countdownViewMock(): CountdownViewMock {
  return {
    clearInterval: vi.fn(),
    matchMedia: vi.fn(() => ({ matches: false })),
    setInterval: vi.fn(() => COUNTDOWN_INTERVAL_ID),
  };
}

/** What a system that asked for less motion answers to the reduced-motion query. */
export const REDUCED_MOTION_MATCH = { matches: true };

/** The two figures the veil shows after the opening three. */
export const COUNTDOWN_SECOND_STEP = 2;
export const COUNTDOWN_LAST_STEP = 1;

/** A document without a window at all — the prerender path. */
export const COUNTDOWN_SSR_DOCUMENT = { defaultView: null };
