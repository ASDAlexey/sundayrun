import { vi } from 'vitest';

import { CREATE_POOL_MOCK } from './protocol-db.service.mock';
import { SqliteHttpModule } from './sqlite-http-loader.type';

/** Replaces `loadSqliteHttp` in the service spec, handing back the mocked `createSQLiteHTTPPool` factory. */
export const LOAD_SQLITE_HTTP_MOCK = vi.fn(() => Promise.resolve({ createSQLiteHTTPPool: CREATE_POOL_MOCK }));

/** A minimal well-typed module the loader's own spec resolves the import seam to. */
export const EXPECTED_MODULE: SqliteHttpModule = { createSQLiteHTTPPool: vi.fn() };

/** A real, importable ES module so the default `@vite-ignore` `import()` can be exercised for coverage. */
export const DATA_URL_MODULE = `data:text/javascript,${encodeURIComponent('export const createSQLiteHTTPPool = () => null;')}`;
