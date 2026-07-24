/** Route param carrying the normalized athlete key (`/athletes/:key`). */
export const KEY_ROUTE_PARAM = 'key';

/** Shown instead of a best time for athletes without a finished 5 km run. */
export const NO_BEST_TIME_TEXT = '—';

/** Shown in the «Место» column for runs whose protocol row carries no place. */
export const NO_PLACE_TEXT = '—';

/** Shown in the «Круг» column for runs whose protocol carries no recorded first-lap split. */
export const NO_LAP_TEXT = '—';

/** The athlete's own rung of the «Мем-пороги» ladder — no benchmark shares the key. */
export const SELF_MEME_KEY = 'self';

/** Highest gender place still counted as a podium finish — the place cell keeps the accent colour. */
export const PODIUM_PLACE = 3;

/** Row height of the runs table in px — the cdk virtual scroll strategy assumes this exact height. */
export const RUNS_TABLE_ROW_HEIGHT_PX = 48;

/** Rows shown before the runs table scrolls internally; a short list (< 30) never gets a scrollbar. */
export const RUNS_TABLE_VISIBLE_ROWS = 30;
