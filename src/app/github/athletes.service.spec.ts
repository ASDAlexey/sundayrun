import { TestBed } from '@angular/core/testing';

import { ProtocolDb } from '../core/sqlite/protocol-db.interface';
import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { AthletesService } from './athletes.service';
import {
  ATHLETE_KEY,
  EXPECTED_ATHLETE_RECORD,
  EXPECTED_COURSE_RECORDS,
  EXPECTED_LEADERBOARD_RECORDS,
  EXPECTED_SQL_STATS,
  POPULATED_SEED,
  UNKNOWN_ATHLETE_KEY,
} from './protocol-db-queries.mock';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';
import { PROTOCOL_DB } from './protocol-db.token';

describe('AthletesService', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  async function serviceOver(db: ProtocolDb): Promise<AthletesService> {
    TestBed.configureTestingModule({ providers: [{ provide: PROTOCOL_DB, useValue: db }] });

    return TestBed.inject(AthletesService);
  }

  it('serves the athlete record, the leaderboards and the overall stats from sundayrun.db', async () => {
    const memory = await createMemoryProtocolDb(POPULATED_SEED);

    close = memory.close;

    const service = await serviceOver(memory.db);

    await expect(service.loadRecord(ATHLETE_KEY)).resolves.toEqual(EXPECTED_ATHLETE_RECORD);
    await expect(service.loadRecord(UNKNOWN_ATHLETE_KEY), 'an unknown key resolves to null').resolves.toBeNull();
    await expect(service.loadRecords()).resolves.toEqual(EXPECTED_LEADERBOARD_RECORDS);
    await expect(service.loadCourseRecords()).resolves.toEqual(EXPECTED_COURSE_RECORDS);
    await expect(service.loadOverallStats()).resolves.toEqual(EXPECTED_SQL_STATS);
  });

  it('propagates a db failure from every read so the page can show a distinct error state', async () => {
    const service = await serviceOver({ queryValues: () => Promise.reject(new Error(PROTOCOL_DB_ERROR_MESSAGE)) });

    await expect(service.loadRecord(ATHLETE_KEY)).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadRecords()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadCourseRecords()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadOverallStats()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
  });
});
