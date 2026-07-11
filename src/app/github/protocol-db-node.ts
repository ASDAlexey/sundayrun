import { readFile } from 'node:fs/promises';

import type { Database } from '@sqlite.org/sqlite-wasm';

import { deserializeDbInto } from '../core/sqlite/deserialize-db';
import { loadSqlite3Node } from '../core/sqlite/sqlite-loader-node';
import { narrowRow } from './protocol-db-narrow';
import { ProtocolDb } from './protocol-db.interface';
import { ProtocolDbBindings, ProtocolDbRow } from './protocol-db.service.type';

/**
 * The Node counterpart to `ProtocolDbService`, used by the static prerender: it reads the local
 * `data/protocol.db` file once, deserializes it into an in-memory sqlite-wasm connection, and
 * answers the very queries `protocol-db-queries` runs in the browser — so the build renders pages
 * from the database instead of the JSON mirror, with no HTTP range requests to fail. The file is
 * opened lazily on the first query and the connection is kept for the whole build. Node-only (it
 * imports `node:fs`); wired solely into the server app config so it never enters the browser bundle.
 */
export function createNodeProtocolDb(dbPath: string): ProtocolDb {
  let connection: Promise<Database> | null = null;

  const open = (): Promise<Database> => (connection ??= openDatabase(dbPath));

  return {
    async query(sql: string, bindings?: ProtocolDbBindings): Promise<ProtocolDbRow[]> {
      const db = await open();
      const rows = db.exec(sql, { bind: bindings, rowMode: 'object', returnValue: 'resultRows' });

      return rows.map(narrowRow);
    },
  };
}

/** Loads the file's bytes into a fresh connection; a missing db or a bad image rejects the query. */
async function openDatabase(dbPath: string): Promise<Database> {
  const sqlite3 = await loadSqlite3Node();
  const dbBytes = new Uint8Array(await readFile(dbPath));
  const db = new sqlite3.oo1.DB();

  deserializeDbInto(sqlite3, db, dbBytes);

  return db;
}
