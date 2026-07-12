import { ProtocolDbValue } from '../core/sqlite/protocol-db-value.type';

/** A seed row so the exported real db answers a keyed lookup with a known value array. */
export const NODE_SEED_SQL: readonly string[] = [
  "INSERT INTO events VALUES ('2026-06-21', '2026-06-21', 12, 'Москва', 'Парк', 'Клуб', 'Иванов', 3, 3, 100, 90, 95)",
];

export const NODE_QUERY_SQL = 'SELECT slug, number FROM events WHERE slug = ?';

/** Positional params, bound `?`-style exactly as drizzle's proxy driver hands them over. */
export const NODE_QUERY_PARAMS: ProtocolDbValue[] = ['2026-06-21'];

/** The narrowed value-array rows the adapter returns for `NODE_QUERY_SQL`. */
export const NODE_EXPECTED_ROWS: ProtocolDbValue[][] = [['2026-06-21', 12]];

export const MISSING_DB_PATH = 'data/does-not-exist.db';
