/** A Pages deploy lands in ~3–5 minutes; half-minute ticks notice it without hammering the CDN. */
export const DB_FRESHNESS_POLL_INTERVAL_MS = 30_000;

/** ~10 minutes of polling: past that the deploy has almost certainly failed, so the poll gives up. */
export const DB_FRESHNESS_POLL_ATTEMPTS = 20;

/** HEAD moves no body bytes; `no-store` defeats the browser cache so the poll sees the deploy land. */
export const DB_FRESHNESS_PROBE_OPTIONS: RequestInit = { method: 'HEAD', cache: 'no-store' };
