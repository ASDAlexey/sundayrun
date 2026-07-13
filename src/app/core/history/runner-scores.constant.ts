/** The score of the event's gender winner — the top of the percent scale. */
export const WINNER_SCORE_PERCENT = 100;

/** Scores keep one decimal — enough to move the rank between two close seasons. */
export const SCORE_ROUND_FACTOR = 10;

/** «Индекс формы» looks one year back, so the rating stays alive, unlike the eternal records. */
export const FORM_INDEX_WINDOW_DAYS = 365;

/**
 * A break longer than this leaves the athlete with no current form: «Индекс формы» goes «—» and
 * the athlete drops off the active rating. Same 90-day rationale as the «Возвращение» badge — a
 * runner silent for a season is no longer racing, however strong their year-old finishes were.
 */
export const FORM_STALE_DAYS = 90;

/** How many best window scores feed «Индекс формы». */
export const FORM_INDEX_TOP_COUNT = 5;

/** The decay horizon of the weighted average: a year-old score weighs half of today's one. */
export const FORM_INDEX_DECAY_DAYS = 730;
