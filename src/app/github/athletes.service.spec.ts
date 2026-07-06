import { TestBed } from '@angular/core/testing';

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { VALID_HISTORY, VALID_HISTORY_TEXT } from '../core/github/history-file.mock';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { CDN_ERROR_MESSAGE, CDN_SERVER_ERROR_STATUS } from './archive.service.mock';
import { AthletesService } from './athletes.service';
import { ATHLETES_HISTORY_LOAD_ERROR_PREFIX } from './athletes.service.constant';
import { ATHLETES_CDN_URL } from './athletes.service.mock';
import { CDN_IMMUTABLE_FETCH_OPTIONS } from './cdn-fetch.constant';
import { CdnRefService } from './cdn-ref.service';
import { cdnRefServiceMock } from './cdn-ref.service.mock';

describe('AthletesService', () => {
  const fetchMock = vi.fn();

  let service: AthletesService;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({
      providers: [{ provide: CdnRefService, useValue: cdnRefServiceMock() }],
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
});
