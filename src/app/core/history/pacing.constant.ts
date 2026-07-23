/** The closing lap of the 5 km course; the opening lap is TWO_THREE_KM_DISTANCE_KM. */
export const SECOND_LAP_DISTANCE_KM = 2.7;

/**
 * The plausibility corridor of the pacing index. The lap button is pressed by hand, so a protocol
 * occasionally stores impossible splits (Lap 1 = 14:59 next to Lap 2 = 8:52); an index outside the
 * corridor reads as that noise and never qualifies anywhere.
 */
export const PACING_INDEX_MIN = 0.6;
export const PACING_INDEX_MAX = 1.8;

/** Valid splits needed before a pacing profile or a season nomination means anything. */
export const PACING_MIN_RUNS = 3;

/** The «ровная раскладка» band of the median index; below it the runner speeds up, above they fade. */
export const PACING_EVEN_MIN_INDEX = 0.97;
export const PACING_EVEN_MAX_INDEX = 1.07;
