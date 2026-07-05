/** First cell of the header row, compared lowercased after trim. */
export const TIMER_EXPORT_HEADER_CELL = 'name';

/** Rows starting from the first 'NOTE…' cell are timer app instructions, not results. */
export const TIMER_EXPORT_NOTE_PREFIX = 'NOTE';

/** Column A: participant full name. */
export const NAME_COLUMN_INDEX = 0;

/** Column B: total time. */
export const TOTAL_COLUMN_INDEX = 1;

/** Columns E and F: Lap 1 and Lap 2. */
export const LAP_COLUMN_INDEXES: readonly number[] = [4, 5];

/** Participant ids are a 1-based sequence in file order. */
export const FIRST_PARTICIPANT_ID = 1;
