import { TestBed } from '@angular/core/testing';

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { VALID_HISTORY, VALID_HISTORY_TEXT } from '../core/github/history-file.mock';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { computeOverallStats } from '../core/history/overall-stats';
import { CDN_ERROR_MESSAGE, CDN_SERVER_ERROR_STATUS } from './archive.service.mock';
import { AthletesService } from './athletes.service';
import { ATHLETES_HISTORY_LOAD_ERROR_PREFIX } from './athletes.service.constant';
import { ATHLETES_CDN_URL } from './athletes.service.mock';
import { CDN_IMMUTABLE_FETCH_OPTIONS } from './cdn-fetch.constant';
import { CdnRefService } from './cdn-ref.service';
import { cdnRefServiceMock } from './cdn-ref.service.mock';
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
import { ProtocolDbService } from './protocol-db.service';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';

describe('AthletesService', () => {
  const fetchMock = vi.fn();
  const dbQuery = vi.fn();
  const [historyKey] = Object.keys(VALID_HISTORY);

  let service: AthletesService;

  beforeEach(() => {
    fetchMock.mockReset();
    dbQuery.mockReset();
    dbQuery.mockRejectedValue(new Error(PROTOCOL_DB_ERROR_MESSAGE));
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: ProtocolDbService, useValue: { query: dbQuery } },
      ],
    });
    service = TestBed.inject(AthletesService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads athletes.json from the CDN once per session and falls back to an empty history on 404/403', async () => {
    fetchMock.mockResolvedValueOnce(new Response(VALID_HISTORY_TEXT));

    const firstLoad = service.loadHistory();

    expect(service.loadHistory(), 'a call racing the first fetch shares the in-flight promise').toBe(firstLoad);
    await expect(firstLoad).resolves.toEqual(VALID_HISTORY);
    await expect(service.loadHistory(), 'the second call reuses the cached promise').resolves.toEqual(VALID_HISTORY);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(ATHLETES_CDN_URL, CDN_IMMUTABLE_FETCH_OPTIONS);

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_NOT_FOUND));

    await expect(TestBed.runInInjectionContext(() => new AthletesService()).loadHistory()).resolves.toEqual({});

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_FORBIDDEN));

    await expect(
      TestBed.runInInjectionContext(() => new AthletesService()).loadHistory(),
      'jsDelivr answers 403 for a never-published file',
    ).resolves.toEqual({});
  });

  it('propagates an unexpected CDN status and a network failure, evicting the failed promise so a retry refetches', async () => {
    fetchMock.mockResolvedValueOnce(statusResponse(CDN_SERVER_ERROR_STATUS));
    fetchMock.mockRejectedValueOnce(new Error(CDN_ERROR_MESSAGE));
    fetchMock.mockResolvedValueOnce(new Response(VALID_HISTORY_TEXT));

    await expect(service.loadHistory()).rejects.toThrow(`${ATHLETES_HISTORY_LOAD_ERROR_PREFIX}${CDN_SERVER_ERROR_STATUS}`);
    await expect(service.loadHistory(), 'the rejected promise was not cached').rejects.toThrow(CDN_ERROR_MESSAGE);
    await expect(service.loadHistory(), 'a later retry succeeds').resolves.toEqual(VALID_HISTORY);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('loadRecord serves the athlete page from sql and falls back to the cached history on a db failure', async () => {
    dbQuery.mockResolvedValueOnce([ATHLETE_SQL_ROW]);
    dbQuery.mockResolvedValueOnce(ATHLETE_RUN_ROWS);
    dbQuery.mockResolvedValueOnce(ATHLETE_PARTICIPATION_ROWS);

    await expect(service.loadRecord(ATHLETE_SQL_ROW.key)).resolves.toEqual(EXPECTED_ATHLETE_RECORD);
    expect(fetchMock, 'the sql path never downloads athletes.json').not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(new Response(VALID_HISTORY_TEXT));

    await expect(service.loadRecord(historyKey)).resolves.toEqual(VALID_HISTORY[historyKey]);
    await expect(service.loadRecord(UNKNOWN_ATHLETE_KEY), 'an unknown key on the fallback path').resolves.toBeNull();
    expect(fetchMock, 'both fallbacks share the one cached history fetch').toHaveBeenCalledTimes(1);
  });

  it('loadRecords serves the leaderboards from sql and falls back to the history values on a db failure', async () => {
    dbQuery.mockResolvedValueOnce(RANKED_ATHLETE_ROWS);
    dbQuery.mockResolvedValueOnce(YEAR_BEST_ROWS);

    await expect(service.loadRecords()).resolves.toEqual(EXPECTED_LEADERBOARD_RECORDS);
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(new Response(VALID_HISTORY_TEXT));

    await expect(service.loadRecords()).resolves.toEqual(Object.values(VALID_HISTORY));
  });

  it('loadOverallStats aggregates in sql and falls back to computing over the history on a db failure', async () => {
    dbQuery.mockResolvedValueOnce([OVERALL_COUNTS_ROW]);
    dbQuery.mockResolvedValueOnce([MEN_MEDIAN_ROW]);
    dbQuery.mockResolvedValueOnce([EMPTY_MEDIAN_ROW]);

    await expect(service.loadOverallStats()).resolves.toEqual(EXPECTED_SQL_STATS);
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(new Response(VALID_HISTORY_TEXT));

    await expect(service.loadOverallStats()).resolves.toEqual(computeOverallStats(VALID_HISTORY));
  });
});
