import { GenderType } from '../core/models/gender.enum';
import { GENDER_VALUES } from './timer-storage.constant';

/**
 * Shape checks shared by the two timer caches. Both read values a person could have hand-edited in
 * devtools, or that an older release wrote, so nothing here throws: an entry that fails a check is
 * dropped and the rest of the payload survives.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isArrayOf<T>(value: unknown, isItem: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(isItem);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

/** A field the model types as `number | null` — `undefined` is not the same thing and is rejected. */
export function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

export function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isOneOf(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === 'string' && allowed.includes(value);
}

export function isNullableGender(value: unknown): value is GenderType | null {
  return value === null || isOneOf(value, GENDER_VALUES);
}
