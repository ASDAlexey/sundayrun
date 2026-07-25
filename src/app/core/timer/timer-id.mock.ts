/** The epoch millisecond every timer fixture is generated at — the same «сейчас» as the session mock. */
export const TIMER_ID_NOW_MS = 1_785_000_000_000;

/** A day and a bit earlier: the id built from it must sort before `TIMER_ID` as a plain string. */
export const EARLIER_TIMER_ID_NOW_MS = 1_784_900_000_000;

/** The deterministic `randomFn` value the fixtures use — exactly the middle of the range. */
export const TIMER_ID_RANDOM = 0.5;

/** `createTimerId(TIMER_ID_NOW_MS, () => TIMER_ID_RANDOM)`. */
export const TIMER_ID = '0ms0mwutc-i00000';

/** `createTimerId(EARLIER_TIMER_ID_NOW_MS, () => TIMER_ID_RANDOM)`. */
export const EARLIER_TIMER_ID = '0mryzdibk-i00000';

/** Both parts at their smallest — the id that proves the padding holds the width. */
export const PADDED_TIMER_ID = '000000000-000000';

/** The tail of the largest value `Math.random` can hand out, one step below 1. */
export const LARGEST_TAIL_RANDOM = 0.999_999_999;

/** Every character an id may contain, and nothing else. */
export const TIMER_ID_ALPHABET = /^[\da-z-]+$/;
