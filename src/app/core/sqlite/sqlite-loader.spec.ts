import { loadSqlite3 } from './sqlite-loader';
import { SQLITE3_INIT_MOCK, SQLITE3_STATIC_MOCK } from './sqlite-loader.mock';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const mock = await import('./sqlite-loader.mock');

  return { default: mock.SQLITE3_INIT_MOCK };
});

describe('loadSqlite3', () => {
  it('lazily imports the wasm module and resolves the initialized sqlite3 namespace', async () => {
    SQLITE3_INIT_MOCK.mockResolvedValue(SQLITE3_STATIC_MOCK);

    await expect(loadSqlite3()).resolves.toBe(SQLITE3_STATIC_MOCK);
    expect(SQLITE3_INIT_MOCK).toHaveBeenCalledTimes(1);
  });
});
