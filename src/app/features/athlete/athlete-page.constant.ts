/** Route param carrying the normalized athlete key (`/athletes/:key`). */
export const KEY_ROUTE_PARAM = 'key';

/** Shown instead of a best time for athletes without a finished 5 km run. */
export const NO_BEST_TIME_TEXT = '—';

/** Shown in the «Место» column for runs whose protocol row carries no place. */
export const NO_PLACE_TEXT = '—';

/** Columns of the runs table, in display order. */
export const RUNS_TABLE_COLUMNS = ['date', 'time', 'place'] as const;
