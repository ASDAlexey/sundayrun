import { vi } from 'vitest';

export const FAKE_DESERIALIZE_POINTER = 4242;

export const FAKE_EXPORTED_BYTES = new Uint8Array([10, 11, 12]);

export const SQLITE_OK_RC = 0;

export const SQLITE_ERROR_RC = 1;

/** `SQLITE_DESERIALIZE_FREEONCLOSE | SQLITE_DESERIALIZE_RESIZEABLE` of the fake capi constants below. */
export const EXPECTED_DESERIALIZE_FLAGS = 3;

/** One recorded `db.exec()` call; `bind` is present only when the statement was parameterized. */
export interface FakeExecCall {
  sql: string;
  bind?: unknown;
}

interface FakeSqlite3State {
  dbs: FakeDb[];
  eventMetaRows: unknown[][];
  objectRows: Record<string, unknown>[];
  rowsBySql: Record<string, unknown[]>;
  deserializeRc: number;
}

/** Shared mutable state inspected by specs; reset via `resetFakeSqlite3()` in `beforeEach`. */
export const FAKE_SQLITE3_STATE: FakeSqlite3State = {
  dbs: [],
  eventMetaRows: [],
  objectRows: [],
  rowsBySql: {},
  deserializeRc: SQLITE_OK_RC,
};

/**
 * Records every executed statement instead of running SQL. A `resultRows` read returns the rows
 * mapped to that exact SQL in `rowsBySql` when set (the write path reads several tables back), else
 * `objectRows` for `rowMode: 'object'` (the Node read adapter) and `eventMetaRows` otherwise (the
 * array-row meta read of the write path).
 */
export class FakeDb {
  executed: FakeExecCall[] = [];
  closed = false;

  constructor() {
    FAKE_SQLITE3_STATE.dbs.push(this);
  }

  exec(sql: string, opts?: { bind?: unknown; returnValue?: string; rowMode?: string }): unknown {
    this.executed.push(opts?.bind === undefined ? { sql } : { sql, bind: opts.bind });

    if (opts?.returnValue !== 'resultRows') {
      return this;
    }

    if (sql in FAKE_SQLITE3_STATE.rowsBySql) {
      return FAKE_SQLITE3_STATE.rowsBySql[sql];
    }

    return opts.rowMode === 'object' ? FAKE_SQLITE3_STATE.objectRows : FAKE_SQLITE3_STATE.eventMetaRows;
  }

  checkRc(rc: number): this {
    if (rc !== SQLITE_OK_RC) {
      throw new Error(`sqlite result code ${rc}`);
    }

    return this;
  }

  close(): void {
    this.closed = true;
  }
}

export const ALLOC_FROM_TYPED_ARRAY_MOCK = vi.fn(() => FAKE_DESERIALIZE_POINTER);

export const SQLITE3_DESERIALIZE_MOCK = vi.fn(() => FAKE_SQLITE3_STATE.deserializeRc);

export const SQLITE3_JS_DB_EXPORT_MOCK = vi.fn(() => FAKE_EXPORTED_BYTES);

/** The minimal `Sqlite3Static` surface used by `protocol-db-write.ts`. */
export const FAKE_SQLITE3 = {
  oo1: { DB: FakeDb },
  wasm: { allocFromTypedArray: ALLOC_FROM_TYPED_ARRAY_MOCK },
  capi: {
    SQLITE_DESERIALIZE_FREEONCLOSE: 1,
    SQLITE_DESERIALIZE_RESIZEABLE: 2,
    sqlite3_deserialize: SQLITE3_DESERIALIZE_MOCK,
    sqlite3_js_db_export: SQLITE3_JS_DB_EXPORT_MOCK,
  },
};

export function resetFakeSqlite3(): void {
  FAKE_SQLITE3_STATE.dbs = [];
  FAKE_SQLITE3_STATE.eventMetaRows = [];
  FAKE_SQLITE3_STATE.objectRows = [];
  FAKE_SQLITE3_STATE.rowsBySql = {};
  FAKE_SQLITE3_STATE.deserializeRc = SQLITE_OK_RC;
  ALLOC_FROM_TYPED_ARRAY_MOCK.mockClear();
  SQLITE3_DESERIALIZE_MOCK.mockClear();
  SQLITE3_JS_DB_EXPORT_MOCK.mockClear();
}
