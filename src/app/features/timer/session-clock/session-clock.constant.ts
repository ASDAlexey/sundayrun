/** The countdown starts at three. */
export const TIMER_COUNTDOWN_FROM = 3;

/** One countdown step, ms. Three steps plus the launch pulse ≈ 1 s — the budget from the plan. */
export const TIMER_COUNTDOWN_STEP_MS = 320;

/** The step after «1» launches the race. */
export const TIMER_COUNTDOWN_LAUNCH = 0;

/** Somebody who asked for less motion gets no countdown at all — the race starts at once. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** An empty field has no progress to show, and a bar of `scaleX(0)` is the honest answer. */
export const TIMER_PROGRESS_EMPTY = 0;
