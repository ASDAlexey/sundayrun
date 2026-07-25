/**
 * How often the big digits are repainted. The figure carries hundredths, so the old quarter of a
 * second is no longer honest: a readout has to be sampled faster than its own resolution or the last
 * field jumps in steps of twenty-five. 30 ms is under two frames of a 60 Hz screen — every hundredth
 * that reaches the eye is fresh, and nothing is drawn that the phone could not show anyway. The cost
 * is a repaint of one component: the digits are the only binding that reads the tick. The recorded
 * times do not come from here at all — a split reads the monotonic clock inside `pointerdown`.
 */
export const TIMER_TICK_INTERVAL_MS = 30;

/** What the clock shows before it is started, and the floor a skewed system clock is clamped to. */
export const TIMER_CLOCK_IDLE_MS = 0;
