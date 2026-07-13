import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

/**
 * Loads and initializes the official SQLite wasm build on demand. The module is imported
 * dynamically so nothing executes (and no wasm is fetched) until the admin publish flow —
 * the only writer — actually needs it in the browser; `sqlite3InitModule` caches its own
 * instance, so repeated calls are cheap.
 *
 * The glue resolves `sqlite3.wasm` via `new URL('sqlite3.wasm', import.meta.url)`, i.e. next to its
 * own chunk under the locale dir; build-sqlite-assets.ts drops the binary there so the lookup lands.
 */
export async function loadSqlite3(): Promise<Sqlite3Static> {
  const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');

  return sqlite3InitModule();
}
