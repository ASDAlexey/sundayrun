import { TestBed } from '@angular/core/testing';

import { EVENT_DATE_ISO } from '../core/github/event-paths.mock';
import { buildEventResultsFile } from '../core/github/results-file';
import { PROTOCOL_ROWS, RACE_EVENT } from '../core/github/spec-utils/race-fixtures';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';
import { PROTOCOL_DB } from './protocol-db.token';
import { ResultsService } from './results.service';

describe('ResultsService', () => {
  const dbQuery = vi.fn();

  let service: ResultsService;

  beforeEach(() => {
    dbQuery.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: PROTOCOL_DB, useValue: { query: dbQuery } }],
    });
    service = TestBed.inject(ResultsService);
  });

  it('serves the protocol from sql and reuses the cached load per slug', async () => {
    dbQuery.mockResolvedValueOnce([RACE_EVENT]);
    dbQuery.mockResolvedValueOnce(PROTOCOL_ROWS);

    const firstLoad = service.loadResults(EVENT_DATE_ISO);

    expect(service.loadResults(EVENT_DATE_ISO), 'a call racing the first load shares the in-flight promise').toBe(firstLoad);
    await expect(firstLoad).resolves.toEqual(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));
    await expect(service.loadResults(EVENT_DATE_ISO), 'the cached load is reused').resolves.toEqual(
      buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS),
    );
    expect(dbQuery, 'one event select plus one results select, then the cache answers').toHaveBeenCalledTimes(2);
  });

  it('evicts a null and a rejected load, so a reload sees a protocol published later', async () => {
    dbQuery.mockResolvedValueOnce([]);

    await expect(service.loadResults(EVENT_DATE_ISO), 'an unknown slug resolves to not-found').resolves.toBeNull();

    dbQuery.mockRejectedValueOnce(new Error(PROTOCOL_DB_ERROR_MESSAGE));

    await expect(service.loadResults(EVENT_DATE_ISO), 'a persistent db failure rejects').rejects.toThrow(PROTOCOL_DB_ERROR_MESSAGE);

    dbQuery.mockResolvedValueOnce([RACE_EVENT]);
    dbQuery.mockResolvedValueOnce(PROTOCOL_ROWS);

    await expect(service.loadResults(EVENT_DATE_ISO), 'neither the null nor the rejection was cached').resolves.toEqual(
      buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS),
    );
  });
});
