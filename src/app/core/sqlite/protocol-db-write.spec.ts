import { applyEventToDb, removeEventFromDb } from './protocol-db-write';
import { PROTOCOL_DB_MAIN_SCHEMA } from './protocol-db-write.constant';
import {
  DB_REMOVAL_MOCK,
  DB_UPDATE_MOCK,
  EXISTING_DB_BYTES_MOCK,
  EXPECTED_APPLY_EXECUTED_EXISTING,
  EXPECTED_APPLY_EXECUTED_FRESH,
  EXPECTED_PASSTHROUGH_ATHLETE_INSERTS,
  EXPECTED_REMOVE_EXECUTED,
  MIXED_GENDER_DB_ROWS,
  MIXED_GENDER_META_ROWS,
  PRESERVED_EVENT_META_ROWS,
  PREVIOUS_DB_ROWS,
  UNKNOWN_REMOVAL_MOCK,
} from './protocol-db-write.mock';
import {
  ALLOC_FROM_TYPED_ARRAY_MOCK,
  EXPECTED_DESERIALIZE_FLAGS,
  FAKE_DESERIALIZE_POINTER,
  FAKE_EXPORTED_BYTES,
  FAKE_SQLITE3_STATE,
  SQLITE3_DESERIALIZE_MOCK,
  SQLITE3_JS_DB_EXPORT_MOCK,
  SQLITE_ERROR_RC,
  resetFakeSqlite3,
} from './spec-utils/fake-sqlite3';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const fake = await import('./spec-utils/fake-sqlite3');

  return { default: () => Promise.resolve(fake.FAKE_SQLITE3) };
});

describe('protocol-db-write', () => {
  beforeEach(() => {
    resetFakeSqlite3();
  });

  it('applies an event to existing db bytes: reads the previous state back, preserves club meta and replaces only the published results', async () => {
    FAKE_SQLITE3_STATE.rowsBySql = PREVIOUS_DB_ROWS;
    FAKE_SQLITE3_STATE.eventMetaRows = PRESERVED_EVENT_META_ROWS;

    await expect(applyEventToDb(EXISTING_DB_BYTES_MOCK, DB_UPDATE_MOCK)).resolves.toBe(FAKE_EXPORTED_BYTES);

    const db = FAKE_SQLITE3_STATE.dbs[0];

    expect(ALLOC_FROM_TYPED_ARRAY_MOCK).toHaveBeenCalledWith(EXISTING_DB_BYTES_MOCK);
    expect(SQLITE3_DESERIALIZE_MOCK).toHaveBeenCalledWith(
      db,
      PROTOCOL_DB_MAIN_SCHEMA,
      FAKE_DESERIALIZE_POINTER,
      EXISTING_DB_BYTES_MOCK.byteLength,
      EXISTING_DB_BYTES_MOCK.byteLength,
      EXPECTED_DESERIALIZE_FLAGS,
    );
    expect(db.executed).toEqual(EXPECTED_APPLY_EXECUTED_EXISTING);
    expect(SQLITE3_JS_DB_EXPORT_MOCK).toHaveBeenCalledWith(db);
    expect(db.closed, 'the connection is released after the export').toBe(true);
  });

  it('creates a fresh db with 1 KiB pages and the shared schema when no db is published yet', async () => {
    await expect(applyEventToDb(null, DB_UPDATE_MOCK)).resolves.toBe(FAKE_EXPORTED_BYTES);

    expect(SQLITE3_DESERIALIZE_MOCK).not.toHaveBeenCalled();
    expect(FAKE_SQLITE3_STATE.dbs[0].executed).toEqual(EXPECTED_APPLY_EXECUTED_FRESH);
  });

  it('removes an event: drops its results rows and rebuilds the summaries without it', async () => {
    FAKE_SQLITE3_STATE.rowsBySql = PREVIOUS_DB_ROWS;
    FAKE_SQLITE3_STATE.eventMetaRows = PRESERVED_EVENT_META_ROWS;

    await expect(removeEventFromDb(EXISTING_DB_BYTES_MOCK, DB_REMOVAL_MOCK)).resolves.toBe(FAKE_EXPORTED_BYTES);

    expect(FAKE_SQLITE3_STATE.dbs[0].executed).toEqual(EXPECTED_REMOVE_EXECUTED);
  });

  it('writes read athletes straight back, keeping a male code and a DNF null gender', async () => {
    FAKE_SQLITE3_STATE.rowsBySql = MIXED_GENDER_DB_ROWS;
    FAKE_SQLITE3_STATE.eventMetaRows = MIXED_GENDER_META_ROWS;

    await expect(removeEventFromDb(EXISTING_DB_BYTES_MOCK, UNKNOWN_REMOVAL_MOCK)).resolves.toBe(FAKE_EXPORTED_BYTES);

    const { executed } = FAKE_SQLITE3_STATE.dbs[0];

    for (const athleteInsert of EXPECTED_PASSTHROUGH_ATHLETE_INSERTS) {
      expect(executed).toContainEqual(athleteInsert);
    }
  });

  it('closes the connection even when the downloaded bytes fail to deserialize', async () => {
    FAKE_SQLITE3_STATE.deserializeRc = SQLITE_ERROR_RC;

    await expect(applyEventToDb(EXISTING_DB_BYTES_MOCK, DB_UPDATE_MOCK)).rejects.toThrow(String(SQLITE_ERROR_RC));
    expect(FAKE_SQLITE3_STATE.dbs[0].closed).toBe(true);
  });
});
