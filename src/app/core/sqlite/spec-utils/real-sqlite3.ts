import { readFile } from 'node:fs/promises';

import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { vi } from 'vitest';

import { SQLITE_WASM_NODE_PATH } from '../sqlite-loader-node.constant';

interface SqliteWasmModule {
  default: (config: { wasmBinary: Uint8Array }) => Promise<Sqlite3Static>;
}

let cached: Promise<Sqlite3Static> | null = null;

/**
 * Initializes the true sqlite-wasm engine from the on-disk `.wasm` so it runs in the vitest node env.
 * Specs mock `@sqlite.org/sqlite-wasm` with a default that delegates here, turning both the browser
 * `loadSqlite3` and the Node loader into real read/DML/export against SQLite instead of a fake. It
 * reaches the real module through `vi.importActual` (the mock only rewires the loaders' import, not
 * ours) and caches the namespace, so a roundtrip's several opens never re-read the wasm.
 */
export function realSqlite3Init(): Promise<Sqlite3Static> {
  return (cached ??= realSqlite3InitModule());
}

async function realSqlite3InitModule(): Promise<Sqlite3Static> {
  const { default: sqlite3InitModule } = await vi.importActual<SqliteWasmModule>('@sqlite.org/sqlite-wasm');
  const wasmBinary = new Uint8Array(await readFile(SQLITE_WASM_NODE_PATH));

  return sqlite3InitModule({ wasmBinary });
}
