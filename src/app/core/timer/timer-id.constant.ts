/** Digits plus lowercase latin letters: the widest alphabet that still fits `[a-z0-9-]`. */
export const TIMER_ID_RADIX = 36;

/**
 * Width of the base-36 time prefix. Nine characters hold every epoch millisecond up to the year
 * 5188, so the prefix never grows and plain string comparison keeps ids in creation order.
 */
export const TIMER_ID_TIME_LENGTH = 9;

/** Width of the random tail. */
export const TIMER_ID_RANDOM_LENGTH = 6;

/** `36 ** TIMER_ID_RANDOM_LENGTH` — 2.2 billion tails per millisecond makes a clash a non-event. */
export const TIMER_ID_RANDOM_RANGE = 2_176_782_336;

/** Fixed-width padding of both parts; a shorter number must not sort before a longer one. */
export const TIMER_ID_PAD_CHAR = '0';

/** Splits the time prefix from the random tail — the only non-alphanumeric character in an id. */
export const TIMER_ID_SEPARATOR = '-';
