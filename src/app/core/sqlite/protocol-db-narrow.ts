import { ProtocolDbValue } from './protocol-db-value.type';

/**
 * The wasm boundary hands back positional `SQLValue[]` rows — a wider union than the number/string/null
 * `sundayrun.db` actually stores. Rebuilding each row with `narrowValue` turns that external shape into a
 * `ProtocolDbValue[]` by construction, so the executors (the browser range service, the Node adapter and
 * the in-memory oo1 wrapper alike) never resort to a type assertion.
 */
export function narrowValues(row: readonly unknown[]): ProtocolDbValue[] {
  return row.map(narrowValue);
}

/** Keeps the number/string/null the db holds; anything else (a stray blob) folds to null. */
function narrowValue(value: unknown): ProtocolDbValue {
  if (typeof value === 'number' || typeof value === 'string' || value === null) {
    return value;
  }

  return null;
}
