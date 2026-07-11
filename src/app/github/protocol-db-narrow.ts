import { ProtocolDbRow, ProtocolDbValue } from './protocol-db.service.type';

/**
 * The wasm boundary hands back `Record<string, SQLValue>` — a wider union than the number/string/null
 * `protocol.db` actually stores. Rebuilding the row with `narrowValue` turns that external shape into a
 * `ProtocolDbRow` by construction, so the read layer (the browser range service and the Node adapter
 * alike) never resorts to a type assertion.
 */
export function narrowRow(row: Record<string, unknown>): ProtocolDbRow {
  const narrowed: ProtocolDbRow = {};

  for (const [columnName, value] of Object.entries(row)) {
    narrowed[columnName] = narrowValue(value);
  }

  return narrowed;
}

/** Keeps the number/string/null the db holds; anything else (a stray blob) folds to null. */
function narrowValue(value: unknown): ProtocolDbValue {
  if (typeof value === 'number' || typeof value === 'string' || value === null) {
    return value;
  }

  return null;
}
