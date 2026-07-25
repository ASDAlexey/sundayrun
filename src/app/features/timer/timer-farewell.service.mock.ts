import { WritableSignal, signal } from '@angular/core';

import { COMPLETE_SESSION } from '../../core/timer/session-splits.mock';
import { TimerSession } from '../../core/timer/timer-session.interface';

/** The stand-in the page and the clock get: two flags the spec raises by hand. */
export interface TimerFarewellServiceMock {
  waving: WritableSignal<boolean>;
  settled: WritableSignal<boolean>;
}

export function timerFarewellServiceMock(): TimerFarewellServiceMock {
  return { waving: signal(false), settled: signal(false) };
}

/** The handle the mocked window hands back for the wave, so the spec can assert what was cleared. */
export const FAREWELL_WAVE_TIMEOUT_ID = 7;

/** The same finished race written down once more — a new object that is still complete. */
export const COMPLETE_SESSION_TOUCHED: TimerSession = { ...COMPLETE_SESSION };
