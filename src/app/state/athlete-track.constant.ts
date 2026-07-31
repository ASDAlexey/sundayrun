export const TRACK_DB_NAME = 'sundayrun-tracks';

export const TRACK_DB_VERSION = 1;

/** Tracks keyed by race slug. */
export const TRACK_STORE = 'tracks';

/** The «asked and found nothing» journal, keyed by race date. */
export const TRACK_CHECK_STORE = 'checks';

/**
 * How many empty answers a race day takes before it is closed for good.
 *
 * Three covers the usual «watch synced later that evening / next morning» case without asking
 * the provider about a five-year-old race forever.
 */
export const TRACK_CHECK_ATTEMPT_LIMIT = 3;
