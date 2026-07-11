import { SQLITE_WASM_NODE_PATH } from '../core/sqlite/sqlite-loader-node.constant';
import {
  ALLOC_FROM_TYPED_ARRAY_MOCK,
  FAKE_SQLITE3_STATE,
  SQLITE3_DESERIALIZE_MOCK,
  resetFakeSqlite3,
} from '../core/sqlite/spec-utils/fake-sqlite3';
import { createNodeProtocolDb } from './protocol-db-node';
import {
  MISSING_DB_ERROR,
  NODE_DB_BYTES,
  NODE_DB_PATH,
  NODE_NARROWED_ROWS,
  NODE_QUERY_BINDINGS,
  NODE_QUERY_SQL,
  NODE_RAW_ROWS,
  READ_FILE_MOCK,
} from './protocol-db-node.mock';

vi.mock('node:fs/promises', async () => {
  const mock = await import('./protocol-db-node.mock');

  return { readFile: mock.READ_FILE_MOCK };
});

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const fake = await import('../core/sqlite/spec-utils/fake-sqlite3');

  return { default: () => Promise.resolve(fake.FAKE_SQLITE3) };
});

describe('createNodeProtocolDb', () => {
  beforeEach(() => {
    resetFakeSqlite3();
    READ_FILE_MOCK.mockReset();
  });

  it('loads the wasm engine and the local db once, then answers object queries with narrowed rows', async () => {
    READ_FILE_MOCK.mockResolvedValue(NODE_DB_BYTES);
    FAKE_SQLITE3_STATE.objectRows = NODE_RAW_ROWS;

    const db = createNodeProtocolDb(NODE_DB_PATH);

    await expect(db.query(NODE_QUERY_SQL, NODE_QUERY_BINDINGS)).resolves.toEqual(NODE_NARROWED_ROWS);
    await expect(db.query(NODE_QUERY_SQL), 'the connection is cached, so the db is opened only once').resolves.toEqual(NODE_NARROWED_ROWS);

    expect(READ_FILE_MOCK).toHaveBeenNthCalledWith(1, SQLITE_WASM_NODE_PATH);
    expect(READ_FILE_MOCK).toHaveBeenNthCalledWith(2, NODE_DB_PATH);
    expect(READ_FILE_MOCK, 'the wasm and the db are each read once, then the connection is reused').toHaveBeenCalledTimes(2);
    expect(ALLOC_FROM_TYPED_ARRAY_MOCK).toHaveBeenCalledExactlyOnceWith(new Uint8Array(NODE_DB_BYTES));
    expect(SQLITE3_DESERIALIZE_MOCK).toHaveBeenCalledOnce();
    expect(FAKE_SQLITE3_STATE.dbs).toHaveLength(1);
    expect(FAKE_SQLITE3_STATE.dbs[0].executed).toEqual([{ sql: NODE_QUERY_SQL, bind: NODE_QUERY_BINDINGS }, { sql: NODE_QUERY_SQL }]);
  });

  it('rejects the query when the local db file is missing', async () => {
    READ_FILE_MOCK.mockImplementation((path: string) =>
      path === NODE_DB_PATH ? Promise.reject(new Error(MISSING_DB_ERROR)) : Promise.resolve(NODE_DB_BYTES),
    );

    await expect(createNodeProtocolDb(NODE_DB_PATH).query(NODE_QUERY_SQL)).rejects.toThrow(MISSING_DB_ERROR);
  });
});
