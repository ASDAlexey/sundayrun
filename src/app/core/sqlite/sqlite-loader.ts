import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

/**
 * Loads and initializes the official SQLite wasm build on demand. The module is imported
 * dynamically so nothing executes (and no wasm is fetched) until the admin publish flow —
 * the only writer — actually needs it in the browser; `sqlite3InitModule` caches its own
 * instance, so repeated calls are cheap.
 */
export async function loadSqlite3(): Promise<Sqlite3Static> {
  const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');

  return sqlite3InitModule();
}
