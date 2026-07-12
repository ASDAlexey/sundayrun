import { drizzle, SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';

import { ProtocolDb } from './protocol-db.interface';
import * as schema from './protocol-db.schema';

/** The typed drizzle handle the query/write layers run against, schema-aware for relational queries. */
export type ProtocolDrizzle = SqliteRemoteDatabase<typeof schema>;

/**
 * Wraps a positional {@link ProtocolDb} executor as a typed drizzle handle: the query/write layers
 * express reads and DML through the drizzle query-builder, and the proxy driver forwards the compiled
 * `?`-positional SQL to `queryValues`, mapping the returned value arrays back to the selected fields.
 * A `get` (single-row read) takes the first row, so drizzle sees one object, not an array.
 */
export function createProtocolDrizzle(db: ProtocolDb): ProtocolDrizzle {
  return drizzle(
    async (sql, params, method) => {
      const rows = await db.queryValues(sql, params);

      return { rows: method === 'get' ? (rows[0] ?? []) : rows };
    },
    { schema },
  );
}
