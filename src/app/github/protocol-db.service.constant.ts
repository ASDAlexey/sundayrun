import type { VFSHTTP } from 'sqlite-wasm-http';

/** The pages run one query at a time, so a single SQLite worker is enough. */
export const PROTOCOL_DB_WORKER_COUNT = 1;

/**
 * `maxPageSize` matches the `PRAGMA page_size = 1024` the db is built with, so every range
 * request stays one small page. The backend is pinned to `sync`: the shared-cache flavour
 * needs `SharedArrayBuffer` (COOP/COEP headers GitHub Pages never sends) and would spawn a
 * second worker the build does not ship.
 */
export const PROTOCOL_DB_HTTP_OPTIONS: VFSHTTP.Options = { maxPageSize: 1024, backendType: 'sync' };

export const PROTOCOL_DB_BROWSER_ONLY_ERROR = 'sundayrun.db queries run in the browser only';

/**
 * How many times a single query is attempted before it surfaces the failure. With the JSON fallback
 * gone, a lone transient range hiccup (a dropped connection, a momentary CDN 5xx) must not turn into
 * a page-level error: a failed attempt evicts the pool, so the next attempt reconnects from scratch.
 * Two attempts (one retry) masks a single blip; a genuinely unreachable db still fails fast.
 */
export const PROTOCOL_DB_QUERY_ATTEMPTS = 2;
