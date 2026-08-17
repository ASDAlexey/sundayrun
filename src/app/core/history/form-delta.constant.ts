/**
 * How far either side of the baseline still counts as an ordinary day — ±3%, some 36 seconds on a
 * 20-minute median. A 5 km time swings by more than that on the weather, the sleep and the queue at
 * the start line alone, so a figure inside the corridor is not a result the runner produced: it is
 * the same runner, running the same way. The corridor is what keeps the column from reading as a
 * board of shortfalls — most of a field lands inside it, and the protocol says so.
 */
export const FORM_DELTA_CORRIDOR_RATIO = 0.03;

/** Marks a figure inside the corridor: «≈ +0:07,05» — the number, held at arm's length. */
export const FORM_DELTA_USUAL_PREFIX = '≈ ';
