/**
 * The distance the club declares, against which the recording's own figure is read.
 *
 * Not `FIVE_KM_DISTANCE_KM` in metres by coincidence: this is the number the extra metres are
 * counted from, and the point of the line is that a watch never agrees with it.
 */
export const DECLARED_RACE_METERS = 5000;

/**
 * How much of the run each sample's pace is read over, in metres either side.
 *
 * Point-to-point pace off a consumer receiver is noise: a metre of drift on a one-second sample is
 * half a minute per kilometre. Seventy-five metres each way is about half a minute of running —
 * long enough to be a pace and short enough to still show the climb out of the far corner.
 */
export const PACE_WINDOW_M = 75;

/**
 * The shortest recording worth drawing. A watch stopped at the start line or a file that lost most
 * of its samples is not this race, and a two-point «track» would draw a straight line across the
 * park and call it a run.
 */
export const TRACK_MIN_METERS = 1000;

export const TRACK_MIN_SAMPLES = 10;
