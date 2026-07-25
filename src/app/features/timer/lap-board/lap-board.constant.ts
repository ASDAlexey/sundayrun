/**
 * A row that already sits where its place asks for travels nowhere — neither plain rows nor marked
 * ones. The FLIP move is counted in rows, not in pixels: `lap-board.scss` owns the two heights and
 * the browser multiplies, so a row can be resized in the stylesheet without the overtakes drifting.
 */
export const TIMER_LAP_NO_STEPS = 0;

/** A marked row is one line taller than a plain one, and that line is the second unit of the move. */
export const TIMER_LAP_ONE_STEP = 1;

/** The gap column stays empty for the leader of the lap — he is nobody's chaser. */
export const TIMER_LAP_NO_GAP_TEXT = '';

/** Ahead-of-the-leader times are signed, so «+1:42» reads as a gap and not as a lap time. */
export const TIMER_LAP_GAP_PREFIX = '+';

/** Nobody is left out on the course — the «ещё N не прошли круг» line stays away. */
export const TIMER_LAP_NOBODY_PENDING = 0;
