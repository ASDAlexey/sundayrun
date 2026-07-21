/** A Pages deploy lands in ~3–5 minutes; half-minute ticks notice it without hammering the CDN. */
export const DB_FRESHNESS_POLL_INTERVAL_MS = 30_000;

/** ~10 minutes of polling: past that the deploy has almost certainly failed, so the poll gives up. */
export const DB_FRESHNESS_POLL_ATTEMPTS = 20;

/** HEAD moves no body bytes; `no-store` defeats the browser cache so the poll sees the deploy land. */
export const DB_FRESHNESS_PROBE_OPTIONS: RequestInit = { method: 'HEAD', cache: 'no-store' };

/** The cache-busting query param on the second-opinion pointer read; the value is `Date.now()`. */
export const FRESH_POINTER_QUERY_PARAM = 'fresh';

/** `no-store` skips the browser cache; the unique query already skips raw's CDN cache. */
export const FRESH_POINTER_FETCH_OPTIONS: RequestInit = { cache: 'no-store' };
