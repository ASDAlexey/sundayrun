import { loadSqlite3 } from './sqlite-loader';
import { SQLITE3_INIT_MOCK, SQLITE3_STATIC_MOCK, SQLITE_WASM_FILE_NAME } from './sqlite-loader.mock';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const mock = await import('./sqlite-loader.mock');

  return { default: mock.SQLITE3_INIT_MOCK };
});

describe('loadSqlite3', () => {
  it('lazily imports the wasm module, pins the wasm lookup to the web root and resolves the namespace', async () => {
    SQLITE3_INIT_MOCK.mockResolvedValue(SQLITE3_STATIC_MOCK);

    await expect(loadSqlite3()).resolves.toBe(SQLITE3_STATIC_MOCK);
    expect(SQLITE3_INIT_MOCK).toHaveBeenCalledTimes(1);

    const [{ locateFile }] = SQLITE3_INIT_MOCK.mock.calls[0];

    expect(locateFile(SQLITE_WASM_FILE_NAME), 'the bare name lets fetch resolve against the document base, not the chunk location').toBe(
      SQLITE_WASM_FILE_NAME,
    );
  });
});
