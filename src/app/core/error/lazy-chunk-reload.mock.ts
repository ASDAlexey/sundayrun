/** A failed lazy `import()` as bundlers word it after a hashed chunk vanishes on redeploy. */
export const STALE_CHUNK_ERROR = new Error('Failed to fetch dynamically imported module: https://x/ru/chunk-A.js');

/** The classic webpack-style variant, carried on the error name rather than the message. */
export const CHUNK_LOAD_ERROR = Object.assign(new Error('boom'), { name: 'ChunkLoadError' });

/** An ordinary error that must never be mistaken for a stale chunk. */
export const UNRELATED_ERROR = new Error('boom');

/** «Now» for the reload guard, with a stamp inside the window (recent) and one outside it (stale). */
export const RELOAD_NOW_MS = 1_000_000;

export const RECENT_RELOAD_MS = 995_000;

export const OLD_RELOAD_MS = 980_000;
