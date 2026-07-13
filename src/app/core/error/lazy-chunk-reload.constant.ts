/** sessionStorage key holding the ms timestamp of the last stale-chunk reload — the loop guard. */
export const STALE_CHUNK_RELOAD_STORAGE_KEY = 'parkrun.chunk-reload-at';

/** A reload issued within this window is assumed to still be settling, so a broken deploy cannot loop. */
export const STALE_CHUNK_RELOAD_WINDOW_MS = 10_000;

/** Bundlers word a failed lazy `import()` differently; all share one of these phrases (matched case-insensitively). */
export const STALE_CHUNK_ERROR_PATTERN = /dynamically imported module|chunkloaderror|loading chunk|importing a module script failed/i;
