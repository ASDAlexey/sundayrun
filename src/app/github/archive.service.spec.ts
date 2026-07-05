import { TestBed } from '@angular/core/testing';

import { EMPTY_INDEX, EXISTING_INDEX, VALID_INDEX_TEXT } from '../core/github/archive-index.mock';
import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { ArchiveService } from './archive.service';
import { ARCHIVE_INDEX_LOAD_ERROR_PREFIX } from './archive.service.constant';
import { CDN_ERROR_MESSAGE, CDN_SERVER_ERROR_STATUS, INDEX_CDN_URL } from './archive.service.mock';

describe('ArchiveService', () => {
  const fetchMock = vi.fn();

  let service: ArchiveService;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    service = TestBed.inject(ArchiveService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and parses index.json from the CDN, falling back to an empty index only on 404/403', async () => {
    fetchMock.mockResolvedValueOnce(new Response(VALID_INDEX_TEXT));

    await expect(service.loadIndex()).resolves.toEqual(EXISTING_INDEX);
    expect(fetchMock).toHaveBeenCalledWith(INDEX_CDN_URL);

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
});
