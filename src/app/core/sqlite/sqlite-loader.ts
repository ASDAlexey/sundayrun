import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

/**
 * Loads and initializes the official SQLite wasm build on demand. The module is imported
 * dynamically so nothing executes (and no wasm is fetched) until the admin publish flow —
 * the only writer — actually needs it in the browser; `sqlite3InitModule` caches its own
 * instance, so repeated calls are cheap.
 *
 * Left alone, the glue resolves `sqlite3.wasm` via `new URL('sqlite3.wasm', import.meta.url)` —
 * next to its own chunk. On the dev server that chunk is served out of the Vite deps cache where
 * no wasm sits, and the SPA fallback answers the fetch with index.html (`expected magic word 00 61
 * 73 6d, found 3c 21 44 4f`). `locateFile` pins the lookup to the web root instead, where
 * `scripts/build-sqlite-assets.ts` drops `public/sqlite3.wasm` before every build and serve: the
 * glue passes the returned string straight to a main-thread `fetch`, so the bare file name resolves
 * against the document base (honouring `<base href>`) without touching the `document` global.
 */
export async function loadSqlite3(): Promise<Sqlite3Static> {
  const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');

  // The default export accepts an Emscripten config at runtime, but its published type deliberately
  // omits the parameter list; widening it through a typed alias passes `locateFile` without an assertion.
  const initSqlite3: (config: { locateFile: (fileName: string) => string }) => Promise<Sqlite3Static> = sqlite3InitModule;

  return initSqlite3({ locateFile: (fileName) => fileName });
}
