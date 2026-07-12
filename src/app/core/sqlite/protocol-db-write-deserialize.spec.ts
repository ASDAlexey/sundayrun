import { DB_UPDATE_MOCK, EXISTING_DB_BYTES_MOCK } from './protocol-db-write-deserialize.mock';
import { applyEventToDb } from './protocol-db-write';
import { FAKE_SQLITE3_STATE, resetFakeSqlite3, SQLITE_ERROR_RC } from './spec-utils/fake-sqlite3';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const fake = await import('./spec-utils/fake-sqlite3');

  return { default: () => Promise.resolve(fake.FAKE_SQLITE3) };
});

describe('protocol-db-write deserialize failure', () => {
  beforeEach(() => {
    resetFakeSqlite3();
  });

  it('closes the connection even when the downloaded bytes fail to deserialize', async () => {
    FAKE_SQLITE3_STATE.deserializeRc = SQLITE_ERROR_RC;

    await expect(applyEventToDb(EXISTING_DB_BYTES_MOCK, DB_UPDATE_MOCK)).rejects.toThrow(String(SQLITE_ERROR_RC));
    expect(FAKE_SQLITE3_STATE.dbs[0].closed).toBe(true);
  });
});
