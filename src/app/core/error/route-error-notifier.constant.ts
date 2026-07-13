/** Shown when a failed navigation is not a stale chunk (a routing, guard or route-data error). */
export const NAVIGATION_ERROR_MESSAGE = $localize`:@@error.navigation:Не удалось открыть страницу. Попробуйте ещё раз.`;

/** Shown when a reload already fired for a stale chunk yet the load still fails — a broken deploy, not a cache. */
export const STALE_CHUNK_RELOAD_FAILED_MESSAGE = $localize`:@@error.staleChunk:Не удалось загрузить страницу. Обновите вкладку.`;
