import { readFile } from 'node:fs/promises';

import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

import { SQLITE_WASM_NODE_PATH } from './sqlite-loader-node.constant';

/**
 * Loads the SQLite wasm engine for Node (the static prerender). Unlike the browser `loadSqlite3`,
 * it reads the `.wasm` off disk and passes the bytes to Emscripten as `wasmBinary`, so the module
 * never tries to fetch the file relative to its own location — that lookup fails with ENOENT once
 * the server code is bundled into a throwaway prerender directory.
 */
export async function loadSqlite3Node(): Promise<Sqlite3Static> {
  const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');

  // The default export accepts an Emscripten config at runtime, but its published type deliberately
  // omits the parameter list; widening it through a typed alias passes `wasmBinary` without an assertion.
  const initSqlite3: (config: { wasmBinary: Uint8Array }) => Promise<Sqlite3Static> = sqlite3InitModule;
  const wasmBinary = new Uint8Array(await readFile(SQLITE_WASM_NODE_PATH));

  return initSqlite3({ wasmBinary });
}
