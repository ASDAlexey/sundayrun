/** Site-wide totals are grouped the Russian way, same as the home page does it. */
export const COUNT_UP_FORMAT = new Intl.NumberFormat('ru-RU').format;

/** The total the directive counts up to. */
export const COUNT_UP_TARGET = 1234;

/** What the binding renders for that total — the exact string the directive must restore. */
export const COUNT_UP_SETTLED_TEXT = COUNT_UP_FORMAT(COUNT_UP_TARGET);

/** `round(1234 · easeOut(0.5))` — the tally halfway through, already past the midpoint by design. */
export const COUNT_UP_HALFWAY_VALUE = 1080;

/** A small total rendered without a formatter, exercising the default `String`. */
export const COUNT_UP_PLAIN_TARGET = 5;
