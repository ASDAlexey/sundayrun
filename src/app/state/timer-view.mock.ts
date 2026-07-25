import { Mock, vi } from 'vitest';

import { TIMER_ID_NOW_MS, TIMER_ID_RANDOM } from '../core/timer/timer-id.mock';

/** The slice of `DOCUMENT.defaultView` the timer services read; every member is a spy the spec drives. */
export interface TimerViewMock {
  Date: { now: Mock };
  Math: { random: Mock };
  clearInterval: Mock;
  navigator: { storage?: { persist: Mock } };
  performance: { now: Mock };
  setInterval: Mock;
}

/** The wall clock the mocked window reports — the «сейчас» the id fixtures were generated from. */
export const VIEW_NOW_MS = TIMER_ID_NOW_MS;

/** The monotonic clock the mocked window reports; unrelated to the wall clock on purpose. */
export const VIEW_MONOTONIC_MS = 5_000;

/** The handle `setInterval` hands back, so the spec can assert what `clearInterval` was given. */
export const VIEW_INTERVAL_ID = 42;

export function timerViewMock(): TimerViewMock {
  return {
    Date: { now: vi.fn(() => VIEW_NOW_MS) },
    Math: { random: vi.fn(() => TIMER_ID_RANDOM) },
    clearInterval: vi.fn(),
    navigator: { storage: { persist: vi.fn(() => Promise.resolve(true)) } },
    performance: { now: vi.fn(() => VIEW_MONOTONIC_MS) },
    setInterval: vi.fn(() => VIEW_INTERVAL_ID),
  };
}

/** A document without a window at all — the prerender path of every timer service. */
export const SSR_DOCUMENT_MOCK = { defaultView: null };
