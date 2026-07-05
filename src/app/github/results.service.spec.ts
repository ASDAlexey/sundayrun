import { TestBed } from '@angular/core/testing';

import { EVENT_DATE_ISO } from '../core/github/event-paths.mock';
import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { buildEventResultsFile } from '../core/github/results-file';
import { VALID_RESULTS_TEXT } from '../core/github/results-file.mock';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { PROTOCOL_ROWS, RACE_EVENT } from '../core/github/spec-utils/race-fixtures';
import { CDN_ERROR_MESSAGE, CDN_SERVER_ERROR_STATUS } from './archive.service.mock';
import { ResultsService } from './results.service';
import { RESULTS_LOAD_ERROR_PREFIX } from './results.service.constant';
import { FOREIGN_SCHEMA_TEXT, RESULTS_CDN_URL } from './results.service.mock';

describe('ResultsService', () => {
  const fetchMock = vi.fn();

  let service: ResultsService;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    service = TestBed.inject(ResultsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads results.json from the CDN once per slug and resolves null for 404/403 and an unparsable payload', async () => {
    fetchMock.mockResolvedValueOnce(new Response(VALID_RESULTS_TEXT));

    const firstLoad = service.loadResults(EVENT_DATE_ISO);

    expect(service.loadResults(EVENT_DATE_ISO), 'a call racing the first fetch shares the in-flight promise').toBe(firstLoad);
    await expect(firstLoad).resolves.toEqual(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));
    await expect(service.loadResults(EVENT_DATE_ISO), 'the second call reuses the cached promise').resolves.toEqual(
      buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS),
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(RESULTS_CDN_URL);

    const notFoundService = new ResultsService();

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_NOT_FOUND));

    await expect(notFoundService.loadResults(EVENT_DATE_ISO)).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(new Response(VALID_RESULTS_TEXT));

    await expect(
      notFoundService.loadResults(EVENT_DATE_ISO),
      'a null result is not cached, so a protocol published later becomes visible',
    ).resolves.toEqual(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));
    expect(fetchMock).toHaveBeenCalledTimes(3);

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_FORBIDDEN));

    await expect(new ResultsService().loadResults(EVENT_DATE_ISO), 'jsDelivr answers 403 for a never-published file').resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(new Response(FOREIGN_SCHEMA_TEXT));

    await expect(new ResultsService().loadResults(EVENT_DATE_ISO), 'an unexpected schema is treated as not found').resolves.toBeNull();
  });

  it('propagates an unexpected CDN status and a network failure, evicting the failed promise so a retry refetches', async () => {
    fetchMock.mockResolvedValueOnce(statusResponse(CDN_SERVER_ERROR_STATUS));
    fetchMock.mockRejectedValueOnce(new Error(CDN_ERROR_MESSAGE));
    fetchMock.mockResolvedValueOnce(new Response(VALID_RESULTS_TEXT));

    await expect(service.loadResults(EVENT_DATE_ISO)).rejects.toThrow(`${RESULTS_LOAD_ERROR_PREFIX}${CDN_SERVER_ERROR_STATUS}`);
    await expect(service.loadResults(EVENT_DATE_ISO), 'the rejected promise was not cached').rejects.toThrow(CDN_ERROR_MESSAGE);
    await expect(service.loadResults(EVENT_DATE_ISO), 'a later retry succeeds').resolves.toEqual(
      buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
