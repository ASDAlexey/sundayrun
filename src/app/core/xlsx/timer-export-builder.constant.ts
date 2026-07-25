/** Header row of a timer xlsx export, in the exact order `parseTimerExport` expects. */
export const TIMER_EXPORT_HEADER_ROW: readonly string[] = ['Name', 'Total', 'Avg/lap', 'Avg/km', 'Lap 1', 'Lap 2'];

/** Position of lap 1 (the 2.3 km split) in `lapsMs`. */
export const FIRST_LAP_INDEX = 0;

/** Position of lap 2 (the second-lap duration) in `lapsMs`. */
export const SECOND_LAP_INDEX = 1;

/** Value written for a time the participant does not have (DNF, missing lap). */
export const EMPTY_TIME_CELL = '';

/** No recorded lap means there is nothing to average over. */
export const NO_LAPS = 0;
