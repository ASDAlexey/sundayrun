/** Ripple origin before the first tap — the tile centre, so a keyboard-driven cut still looks right. */
export const TIMER_TILE_RIPPLE_ORIGIN = '50%';

/** A tile with no recorded time renders no time node at all. */
export const TIMER_TILE_NO_TIME = '';

/** Repeats of the same tile inside this window are swallowed as a double tap (docs/TIMER.md §4). */
export const TIMER_DOUBLE_TAP_GUARD_MS = 400;

/** Horizontal travel that turns a press into a swipe; below it the gesture is still a tap. */
export const TIMER_SWIPE_MIN_PX = 48;

/** Vertical drift a swipe may carry before it counts as a scroll instead. */
export const TIMER_SWIPE_MAX_DRIFT_PX = 32;

/** How long a press has to sit still before it opens the runner's card instead of timing him. */
export const TIMER_TILE_LONG_PRESS_MS = 600;

/** A leftward swipe retires the runner, a rightward one only rolls the gesture's own tap back. */
export const TIMER_SWIPE_RETIRE_DIRECTION = 0;
