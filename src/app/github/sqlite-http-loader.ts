import { DOCUMENT, InjectionToken, inject } from '@angular/core';

import { SQLITE_HTTP_MODULE_PATH } from './sqlite-http-loader.constant';
import { SqliteHttpImporter, SqliteHttpLoader, SqliteHttpModule } from './sqlite-http-loader.type';

/**
 * Loads the pre-bundled `sqlite-wasm-http` entry that `scripts/build-sqlite-assets.ts` self-hosts
 * under `public/sqlite-http/`. The `@vite-ignore` is load-bearing: it stops Vite from ever
 * resolving or transforming the library source — the whole reason we self-host — so the dev
 * server never trips over the classic workers or the `#…` Node subpath imports. The `moduleUrl` is
 * resolved against the document's `baseURI` in the injection context (see `SQLITE_HTTP_LOADER`), so
 * it survives a deploy sub-path, exactly like the self-hosted fonts.
 *
 * `importModule` is an injectable seam for tests; production passes only the resolved `moduleUrl`.
 */
export function loadSqliteHttp(
  moduleUrl: string,
  importModule: SqliteHttpImporter = (url) => import(/* @vite-ignore */ url),
): Promise<SqliteHttpModule> {
  return importModule(moduleUrl);
}

/**
 * The loader the service injects. The factory runs in an injection context, so it resolves the
 * self-hosted entry against `inject(DOCUMENT).baseURI` once and binds it, keeping production wiring
 * implicit; `useValue` lets specs supply a fake pool factory — the Angular unit-test system forbids
 * `vi.mock` on relative imports, so the dynamic import is swapped through DI rather than a mock.
 */
export const SQLITE_HTTP_LOADER = new InjectionToken<SqliteHttpLoader>('SQLITE_HTTP_LOADER', {
  providedIn: 'root',
  factory: () => loadSqliteHttp.bind(null, new URL(SQLITE_HTTP_MODULE_PATH, inject(DOCUMENT).baseURI).href),
});
