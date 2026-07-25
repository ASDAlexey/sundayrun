import {
  TIMER_ID_PAD_CHAR,
  TIMER_ID_RADIX,
  TIMER_ID_RANDOM_LENGTH,
  TIMER_ID_RANDOM_RANGE,
  TIMER_ID_SEPARATOR,
  TIMER_ID_TIME_LENGTH,
} from './timer-id.constant';

/**
 * Local identifier for a session, runner or split: sortable time prefix plus a random tail.
 *
 * The ids never leave the device — they key tiles, journal entries and the «Мои замеры» list, so
 * they only have to be unique here and cheap to produce inside a `pointerdown` handler. Both parts
 * are zero-padded base 36, which makes the id sortable as a plain string (newer id, larger string)
 * and keeps it inside `[a-z0-9-]`. The clock and the randomness arrive as arguments, so the same
 * pair of inputs always spells the same id and the specs need no stubbed globals.
 */
export function createTimerId(nowMs: number, randomFn: () => number): string {
  const time = padded(Math.floor(nowMs), TIMER_ID_TIME_LENGTH);
  const tail = padded(Math.floor(randomFn() * TIMER_ID_RANDOM_RANGE), TIMER_ID_RANDOM_LENGTH);

  return `${time}${TIMER_ID_SEPARATOR}${tail}`;
}

function padded(value: number, length: number): string {
  return value.toString(TIMER_ID_RADIX).padStart(length, TIMER_ID_PAD_CHAR);
}
