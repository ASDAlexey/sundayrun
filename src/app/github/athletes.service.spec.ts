import { TestBed } from '@angular/core/testing';

import { AthletesService } from './athletes.service';
import {
  ATHLETE_PARTICIPATION_ROWS,
  ATHLETE_RUN_ROWS,
  ATHLETE_SQL_ROW,
  EMPTY_MEDIAN_ROW,
  EXPECTED_ATHLETE_RECORD,
  EXPECTED_LEADERBOARD_RECORDS,
  EXPECTED_SQL_STATS,
  MEN_MEDIAN_ROW,
  OVERALL_COUNTS_ROW,
  RANKED_ATHLETE_ROWS,
  UNKNOWN_ATHLETE_KEY,
  YEAR_BEST_ROWS,
} from './protocol-db-queries.mock';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';
import { PROTOCOL_DB } from './protocol-db.token';

describe('AthletesService', () => {
  const dbQuery = vi.fn();

  let service: AthletesService;

  beforeEach(() => {
    dbQuery.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: PROTOCOL_DB, useValue: { query: dbQuery } }],
    });
    service = TestBed.inject(AthletesService);
  });

  it('serves the athlete record, the leaderboards and the overall stats from protocol.db', async () => {
    dbQuery.mockResolvedValueOnce([ATHLETE_SQL_ROW]);
    dbQuery.mockResolvedValueOnce(ATHLETE_RUN_ROWS);
    dbQuery.mockResolvedValueOnce(ATHLETE_PARTICIPATION_ROWS);

    await expect(service.loadRecord(ATHLETE_SQL_ROW.key)).resolves.toEqual(EXPECTED_ATHLETE_RECORD);

    dbQuery.mockResolvedValueOnce([]);

    await expect(service.loadRecord(UNKNOWN_ATHLETE_KEY), 'an unknown key resolves to null').resolves.toBeNull();

    dbQuery.mockResolvedValueOnce(RANKED_ATHLETE_ROWS);
    dbQuery.mockResolvedValueOnce(YEAR_BEST_ROWS);

    await expect(service.loadRecords()).resolves.toEqual(EXPECTED_LEADERBOARD_RECORDS);

    dbQuery.mockResolvedValueOnce([OVERALL_COUNTS_ROW]);
    dbQuery.mockResolvedValueOnce([MEN_MEDIAN_ROW]);
    dbQuery.mockResolvedValueOnce([EMPTY_MEDIAN_ROW]);

    await expect(service.loadOverallStats()).resolves.toEqual(EXPECTED_SQL_STATS);
  });

  it('propagates a db failure from every read so the page can show a distinct error state', async () => {
    dbQuery.mockRejectedValue(new Error(PROTOCOL_DB_ERROR_MESSAGE));

    await expect(service.loadRecord(ATHLETE_SQL_ROW.key)).rejects.toThrow(PROTOCOL_DB_ERROR_MESSAGE);
    await expect(service.loadRecords()).rejects.toThrow(PROTOCOL_DB_ERROR_MESSAGE);
    await expect(service.loadOverallStats()).rejects.toThrow(PROTOCOL_DB_ERROR_MESSAGE);
  });
});
