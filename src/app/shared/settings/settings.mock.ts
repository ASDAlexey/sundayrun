import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { DeltaBase, DeltaBaseType } from '../../state/delta-base.enum';

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

/** The delta-base picker: one stand-in signal for the card to read, one spy for the pick it makes. */
export interface DeltaBaseServiceMock {
  base: WritableSignal<DeltaBaseType>;
  select: Mock;
}

export function deltaBaseServiceMock(): DeltaBaseServiceMock {
  return { base: signal<DeltaBaseType>(DeltaBase.form), select: vi.fn() };
}

/** The pills of «С чем сравнивать», and the modifier marking the one in force. */
export const SETTINGS_CHOICE_SELECTOR = '.settings__choice';

export const SETTINGS_ACTIVE_CHOICE_SELECTOR = '.settings__choice_active';

/** The card offers the four bases in this order — form first, because it is the default. */
export const EXPECTED_CHOICE_LABELS = ['Форма', 'Этот год', 'Рекорд', 'Скрыть'];
