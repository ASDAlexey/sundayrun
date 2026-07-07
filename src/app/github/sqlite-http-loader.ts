import { InjectionToken } from '@angular/core';

import { SQLITE_HTTP_MODULE_PATH } from './sqlite-http-loader.constant';
import { SqliteHttpImporter, SqliteHttpLoader, SqliteHttpModule } from './sqlite-http-loader.type';

/**
 * Loads the pre-bundled `sqlite-wasm-http` entry that `scripts/build-sqlite-assets.ts` self-hosts
 * under `public/sqlite-http/`. The `@vite-ignore` is load-bearing: it stops Vite from ever
 * resolving or transforming the library source — the whole reason we self-host — so the dev
 * server never trips over the classic workers or the `#…` Node subpath imports. The url is built
 * against `document.baseURI`, so it survives a deploy sub-path, exactly like the self-hosted fonts.
 *
 * `importModule` and `moduleUrl` are injectable seams for tests; production passes neither.
 */
export function loadSqliteHttp(
  importModule: SqliteHttpImporter = (url) => import(/* @vite-ignore */ url),
  moduleUrl: string = new URL(SQLITE_HTTP_MODULE_PATH, document.baseURI).href,
): Promise<SqliteHttpModule> {
  return importModule(moduleUrl);
}

/**
 * The loader the service injects. Defaulting to `loadSqliteHttp` keeps production wiring implicit,
 * while `useValue` lets specs supply a fake pool factory — the Angular unit-test system forbids
 * `vi.mock` on relative imports, so the dynamic import is swapped through DI rather than a mock.
 */
export const SQLITE_HTTP_LOADER = new InjectionToken<SqliteHttpLoader>('SQLITE_HTTP_LOADER', {
  providedIn: 'root',
  factory: () => loadSqliteHttp,
});
