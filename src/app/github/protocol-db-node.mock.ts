import { vi } from 'vitest';

/** Stand-in for `node:fs/promises` `readFile`, driven per-test to return bytes or reject. */
export const READ_FILE_MOCK = vi.fn();

export const NODE_DB_PATH = 'data/protocol.db';

/** The bytes `readFile` hands back; the deserialize path consumes their content, not their identity. */
export const NODE_DB_BYTES = new Uint8Array([1, 2, 3, 4]);

export const NODE_QUERY_SQL = 'SELECT slug FROM events WHERE slug = $slug';

export const NODE_QUERY_BINDINGS = { $slug: '2026-06-21' };

/** The object rows the fake connection returns, including a blob the adapter must fold to null. */
export const NODE_RAW_ROWS = [{ slug: '2026-06-21', number: 12, note: null, digest: new Uint8Array([9]) }];

/** The same rows after narrowing: only the blob changes, folding to null. */
export const NODE_NARROWED_ROWS = [{ slug: '2026-06-21', number: 12, note: null, digest: null }];

export const MISSING_DB_ERROR = 'ENOENT: no such file, open data/protocol.db';
