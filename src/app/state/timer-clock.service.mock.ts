import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { TIMER_CLOCK_IDLE_MS } from './timer-clock.constant';

/** The shape the `timerClockServiceMock` factory returns: one writable signal plus three spies. */
export interface TimerClockServiceMock {
  elapsedMs: WritableSignal<number>;
  start: Mock;
  stop: Mock;
  freeze: Mock;
  nowMs: Mock;
}

/** The monotonic «сейчас» the stubbed clock reports — the `atMs` a tapped tile records in a spec. */
export const CLOCK_MOCK_NOW_MS = 1_234_500;

/** A stubbed race clock: the spec sets the digits it wants and asserts the start/stop calls. */
export function timerClockServiceMock(): TimerClockServiceMock {
  return {
    elapsedMs: signal(TIMER_CLOCK_IDLE_MS),
    start: vi.fn(),
    stop: vi.fn(),
    freeze: vi.fn(),
    nowMs: vi.fn(() => CLOCK_MOCK_NOW_MS),
  };
}

/** How far the monotonic clock moves between two reads of the clock spec — with a stray fraction. */
export const MONOTONIC_STEP_MS = 1_500.6;

/** What the rounded digits must show after that step. */
export const ROUNDED_STEP_MS = 1_501;

/** How much of the race had already run when the dropped tab was reopened. */
export const RESTORED_ELAPSED_MS = 600_000;

/** A wall clock that jumped backwards behind the tab's back; the elapsed time must stay at zero. */
export const SKEWED_EPOCH_STEP_MS = -60_000;

/** What a finished measurement reopened tomorrow puts on the digits — its own stopped reading. */
export const FROZEN_ELAPSED_MS = 1_143_260;
