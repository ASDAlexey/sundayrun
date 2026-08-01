import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { TimerSession } from '../core/timer/timer-session.interface';
import { TimerStatus } from '../core/timer/timer-session.enum';
import { TIMER_SESSION, TIMER_SESSION_IDLE } from '../core/timer/timer-session.mock';

/** The wall clock the mass start is stamped with — frozen, so the assertion can name it. */
export const RACE_START_EPOCH_MS = 1_785_045_600_000;

/** The digits the stubbed clock stands at when the race is stopped. */
export const RACE_ELAPSED_MS = 767_300;

/** A race that is over and reopened later: nothing ticks for it, and the digits owe it its time. */
export const RACE_FINISHED_SESSION: TimerSession = { ...TIMER_SESSION, status: TimerStatus.finished, stoppedAtMs: RACE_ELAPSED_MS };

/** The measurement nobody has been added to yet — «Старт» has nothing to time. */
export const RACE_EMPTY_SESSION: TimerSession = { ...TIMER_SESSION_IDLE, runners: [], splits: [] };

/** The stand-in the cockpit gets: two flags the spec drives, three bare spies it asserts on. */
export interface TimerRaceServiceMock {
  canStart: WritableSignal<boolean>;
  woke: WritableSignal<boolean>;
  start: Mock;
  stop: Mock;
  sync: Mock;
}

export function timerRaceServiceMock(): TimerRaceServiceMock {
  return { canStart: signal(true), woke: signal(false), start: vi.fn(), stop: vi.fn(), sync: vi.fn() };
}
