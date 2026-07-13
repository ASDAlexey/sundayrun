import { STALE_CHUNK_ERROR_PATTERN, STALE_CHUNK_RELOAD_STORAGE_KEY, STALE_CHUNK_RELOAD_WINDOW_MS } from './lazy-chunk-reload.constant';

/**
 * A GitHub Pages deploy swaps the hashed chunk files, so a browser still running an older app shell
 * asks for a chunk name the server no longer has: the lazy `import()` 404s and the navigation dies
 * (e.g. «Сгенерировать протокол» never opens /result).
 */

/** A failed lazy `import()`; the message differs across bundlers, so match the shared phrases. */
export function isStaleChunkError(error: unknown): boolean {
  return error instanceof Error && STALE_CHUNK_ERROR_PATTERN.test(`${error.name} ${error.message}`);
}

/**
 * Reloads once to pull the current shell and its chunk names, stamping a sessionStorage guard so a
 * genuinely broken deploy cannot loop. Returns whether it reloaded (false when the guard held or off
 * a browser), letting the caller tell the user a repeat failure is not just a stale cache.
 */
export function triggerStaleChunkReload(nowMs: number): boolean {
  if (typeof location === 'undefined' || reloadedRecently(nowMs)) {
    return false;
  }

  sessionStorage.setItem(STALE_CHUNK_RELOAD_STORAGE_KEY, String(nowMs));
  location.reload();

  return true;
}

/** True while a just-issued reload might still be settling. */
function reloadedRecently(nowMs: number): boolean {
  const stamped = Number(sessionStorage.getItem(STALE_CHUNK_RELOAD_STORAGE_KEY));

  return stamped > 0 && nowMs - stamped < STALE_CHUNK_RELOAD_WINDOW_MS;
}
