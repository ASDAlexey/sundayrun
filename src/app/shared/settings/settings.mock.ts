import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

/** The stand-in the card gets: one flag the spec drives, one spy it asserts on. */
export interface HundredthsServiceMock {
  shown: WritableSignal<boolean>;
  toggle: Mock;
}

export function hundredthsServiceMock(): HundredthsServiceMock {
  return { shown: signal(true), toggle: vi.fn() };
}

/** Material's switch: `role="switch"`, and `aria-checked` is the state a reader (or a spec) goes by. */
export const SETTINGS_SWITCH_SELECTOR = '.settings__switch button[role="switch"]';
