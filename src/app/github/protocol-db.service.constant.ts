export const PROTOCOL_DB_BROWSER_ONLY_ERROR = 'sundayrun.db queries run in the browser only';

/** Prefixes the HTTP status when the db download itself fails, so the console names the cause. */
export const PROTOCOL_DB_FETCH_ERROR_PREFIX = 'sundayrun.db download failed: HTTP ';

/**
 * How many times a single query is attempted before it surfaces the failure. With the JSON fallback
 * gone, one transient hiccup (a dropped connection, a momentary 5xx) must not turn into a page-level
 * error: a failed attempt evicts the connection, so the next one downloads from scratch. Two
 * attempts (one retry) mask a single blip; a genuinely unreachable db still fails fast.
 */
export const PROTOCOL_DB_QUERY_ATTEMPTS = 2;

/** The fixed connection key for the local db url — a single on-disk file has no sha to pin against. */
export const PROTOCOL_DB_LOCAL_DB_REF = 'local';
