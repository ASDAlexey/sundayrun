import { TestBed } from '@angular/core/testing';

import { EMPTY_INDEX, EXISTING_INDEX, VALID_INDEX_TEXT } from '../core/github/archive-index.mock';
import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { ArchiveService } from './archive.service';
import { ARCHIVE_INDEX_LOAD_ERROR_PREFIX } from './archive.service.constant';
import { CDN_ERROR_MESSAGE, CDN_SERVER_ERROR_STATUS, INDEX_CDN_URL } from './archive.service.mock';
import { CDN_IMMUTABLE_FETCH_OPTIONS } from './cdn-fetch.constant';
import { CdnRefService } from './cdn-ref.service';
import { cdnRefServiceMock } from './cdn-ref.service.mock';
import { EVENT_SQL_ROWS, LATEST_EVENTS_LIMIT } from './protocol-db-queries.mock';
import { ProtocolDbService } from './protocol-db.service';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';

describe('ArchiveService', () => {
  const fetchMock = vi.fn();
  const dbQuery = vi.fn();

  let service: ArchiveService;

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
    service = TestBed.inject(ArchiveService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and parses index.json from the CDN, falling back to an empty index only on 404/403', async () => {
    fetchMock.mockResolvedValueOnce(new Response(VALID_INDEX_TEXT));

    await expect(service.loadIndex()).resolves.toEqual(EXISTING_INDEX);
    expect(fetchMock).toHaveBeenCalledWith(INDEX_CDN_URL, CDN_IMMUTABLE_FETCH_OPTIONS);

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_NOT_FOUND));

    await expect(service.loadIndex()).resolves.toEqual(EMPTY_INDEX);

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_FORBIDDEN));

    await expect(service.loadIndex(), 'jsDelivr answers 403 for a never-published file').resolves.toEqual(EMPTY_INDEX);
  });

  it('propagates an unexpected CDN status and a network failure, so the page can show a distinct error state', async () => {
    fetchMock.mockResolvedValueOnce(statusResponse(CDN_SERVER_ERROR_STATUS));

    await expect(service.loadIndex()).rejects.toThrow(`${ARCHIVE_INDEX_LOAD_ERROR_PREFIX}${CDN_SERVER_ERROR_STATUS}`);

    fetchMock.mockRejectedValueOnce(new Error(CDN_ERROR_MESSAGE));

    await expect(service.loadIndex()).rejects.toThrow(CDN_ERROR_MESSAGE);
  });

  it('serves the index and the latest slice from sql when protocol.db answers', async () => {
    dbQuery.mockResolvedValueOnce(EVENT_SQL_ROWS);

    await expect(service.loadIndex()).resolves.toEqual(EXISTING_INDEX);

    dbQuery.mockResolvedValueOnce(EVENT_SQL_ROWS.slice(0, LATEST_EVENTS_LIMIT));

    await expect(service.loadLatest(LATEST_EVENTS_LIMIT)).resolves.toEqual(EXISTING_INDEX.events.slice(0, LATEST_EVENTS_LIMIT));
    expect(fetchMock, 'the sql path never downloads index.json').not.toHaveBeenCalled();
  });

  it('loadLatest falls back to slicing the json index on a db failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response(VALID_INDEX_TEXT));

    await expect(service.loadLatest(LATEST_EVENTS_LIMIT)).resolves.toEqual(EXISTING_INDEX.events.slice(0, LATEST_EVENTS_LIMIT));
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(INDEX_CDN_URL, CDN_IMMUTABLE_FETCH_OPTIONS);
  });
});
