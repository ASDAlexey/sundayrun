import { deserializeDbInto } from '../deserialize-db';
import { narrowValues } from '../protocol-db-narrow';
import { ProtocolDb } from '../protocol-db.interface';
import { PROTOCOL_DB_SCHEMA_STATEMENTS } from '../protocol-db-schema.constant';
import { loadSqlite3Node } from '../sqlite-loader-node';
import { PROTOCOL_DB_PAGE_SIZE_PRAGMA } from '../protocol-db-write.constant';

/**
 * Builds a REAL in-memory sqlite-wasm oo1 db, applies the production DDL plus the given seed rows, and
 * exposes it as a positional {@link ProtocolDb} executor so drizzle-backed query tests run against the
 * true engine instead of a fake. Specs using this must NOT `vi.mock('@sqlite.org/sqlite-wasm')`.
 */
export async function createMemoryProtocolDb(seedSql: readonly string[]): Promise<{ db: ProtocolDb; close(): void }> {
  const sqlite3 = await loadSqlite3Node();
  const conn = new sqlite3.oo1.DB();

  conn.exec(PROTOCOL_DB_PAGE_SIZE_PRAGMA);

  for (const stmt of PROTOCOL_DB_SCHEMA_STATEMENTS) {
    conn.exec(stmt);
  }

  for (const stmt of seedSql) {
    conn.exec(stmt);
  }

  return {
    db: {
      queryValues: (sql, params) =>
        Promise.resolve(conn.exec(sql, { bind: [...params], rowMode: 'array', returnValue: 'resultRows' }).map(narrowValues)),
    },
    close: () => conn.close(),
  };
}

/** Builds the same seeded db and exports its bytes, so a real `protocol.db` image can be written to disk. */
export async function exportMemoryProtocolDbBytes(seedSql: readonly string[]): Promise<Uint8Array> {
  const sqlite3 = await loadSqlite3Node();
  const conn = new sqlite3.oo1.DB();

  conn.exec(PROTOCOL_DB_PAGE_SIZE_PRAGMA);

  for (const stmt of PROTOCOL_DB_SCHEMA_STATEMENTS) {
    conn.exec(stmt);
  }

  for (const stmt of seedSql) {
    conn.exec(stmt);
  }

  try {
    return sqlite3.capi.sqlite3_js_db_export(conn);
  } finally {
    conn.close();
  }
}

/** Deserializes an exported `protocol.db` image and exposes it as a {@link ProtocolDb} for readback assertions. */
export async function openMemoryProtocolDbFromBytes(dbBytes: Uint8Array): Promise<{ db: ProtocolDb; close(): void }> {
  const sqlite3 = await loadSqlite3Node();
  const conn = new sqlite3.oo1.DB();

  deserializeDbInto(sqlite3, conn, dbBytes);

  return {
    db: {
      queryValues: (sql, params) =>
        Promise.resolve(conn.exec(sql, { bind: [...params], rowMode: 'array', returnValue: 'resultRows' }).map(narrowValues)),
    },
    close: () => conn.close(),
  };
}
