import { vi } from 'vitest';
import type { SQLiteHTTPPool } from 'sqlite-wasm-http';

export const POOL_OPEN_MOCK = vi.fn();

export const POOL_EXEC_MOCK = vi.fn();

export const POOL_CLOSE_MOCK = vi.fn();

/**
 * The fake `SQLiteHTTPPool` the mocked `createSQLiteHTTPPool` hands out; one instance is enough — the
 * spies tell calls apart. The cast lives here, under `spec-utils`, so no app-code file has to assert.
 */
export const POOL_MOCK = { open: POOL_OPEN_MOCK, close: POOL_CLOSE_MOCK, exec: POOL_EXEC_MOCK, backendType: 'sync' } as SQLiteHTTPPool;
