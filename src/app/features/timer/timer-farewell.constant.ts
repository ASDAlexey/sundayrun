/**
 * How long the wave of going-out tiles lasts: `--transition-time` (300 ms) plus the stagger of the
 * bottom row, eleven steps of 20 ms behind the top one. The same two numbers are written into
 * `runner-grid.scss` — change one and the protocol arrives over tiles that are still fading.
 */
export const TIMER_FAREWELL_WAVE_MS = 520;
