import type { Database, Sqlite3Static } from '@sqlite.org/sqlite-wasm';

import { PROTOCOL_DB_MAIN_SCHEMA } from './protocol-db-write.constant';

/**
 * Loads a downloaded `sundayrun.db` image into a fresh connection's `main` schema. Shared by the
 * browser write path and the Node read adapter: both open an empty `oo1.DB` and hand it the bytes
 * they fetched (over the GitHub API or from disk) instead of pointing SQLite at a file, since the
 * wasm build has no real filesystem. `checkRc` turns a non-zero result code into a throw.
 */
export function deserializeDbInto(sqlite3: Sqlite3Static, db: Database, dbBytes: Uint8Array): void {
  const pointer = sqlite3.wasm.allocFromTypedArray(dbBytes);
  const flags = sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE;

  db.checkRc(sqlite3.capi.sqlite3_deserialize(db, PROTOCOL_DB_MAIN_SCHEMA, pointer, dbBytes.byteLength, dbBytes.byteLength, flags));
}
