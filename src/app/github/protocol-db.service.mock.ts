import { vi } from 'vitest';

import { CDN_REF_SHA_MOCK } from './cdn-ref.service.mock';
import { POOL_CLOSE_MOCK, POOL_EXEC_MOCK, POOL_MOCK, POOL_OPEN_MOCK } from './spec-utils/fake-sqlite-pool';

export { POOL_CLOSE_MOCK, POOL_EXEC_MOCK, POOL_MOCK, POOL_OPEN_MOCK };

/** jsDelivrFileUrl(PROTOCOL_DB_PATH, CDN_REF_SHA_MOCK): the sha-pinned CDN url of the SQLite artifact. */
export const PROTOCOL_DB_CDN_URL = `https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@${CDN_REF_SHA_MOCK}/data/protocol.db`;

/** The commit an admin publication pins mid-session, re-pointing the pool. */
export const PINNED_SHA_MOCK = 'freshly-published-sha';

export const PINNED_PROTOCOL_DB_CDN_URL = `https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@${PINNED_SHA_MOCK}/data/protocol.db`;

/** The `createSQLiteHTTPPool` the mocked `loadSqliteHttp` hands back (see `sqlite-http-loader.mock`). */
export const CREATE_POOL_MOCK = vi.fn();

export const DB_SQL_MOCK = 'SELECT slug, number, note, digest FROM events WHERE full_name = ?';

/** Positional params bound `?`-style, exactly as drizzle's proxy driver hands them over. */
export const DB_PARAMS_MOCK = ['иванов иван'];

/**
 * The raw worker rows the wasm boundary returns as positional value arrays, spanning every value kind
 * the service must narrow: a string, a number, a SQL null and a blob (a non number|string|null that
 * folds to null).
 */
export const DB_RAW_ROWS_MOCK = [
  ['2026-06-21', 12, null, new Uint8Array([1])],
  ['2026-06-28', 42, null, new Uint8Array([2])],
];

/** The same rows after narrowing: the blob is the only value that changes, folding to null. */
export const DB_ROWS_MOCK = [
  ['2026-06-21', 12, null, null],
  ['2026-06-28', 42, null, null],
];

/** The worker1 `exec` answer shape the service unwraps: one `{ row, … }` envelope per raw row. */
export const DB_EXEC_RESULTS_MOCK = DB_RAW_ROWS_MOCK.map((row, index) => ({ type: 'exec', row, rowNumber: index + 1 }));

export const POOL_CREATE_ERROR_MESSAGE = 'worker bootstrap failed';

export const POOL_OPEN_ERROR_MESSAGE = 'range requests unsupported';

export const POOL_EXEC_ERROR_MESSAGE = 'statement failed';

export const POOL_CLOSE_ERROR_MESSAGE = 'close timed out';

/** The generic db failure the service specs use to drive the JSON fallback. */
export const PROTOCOL_DB_ERROR_MESSAGE = 'protocol.db unreachable';
