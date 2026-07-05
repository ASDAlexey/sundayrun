import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from '../core/github/github-api.constant';
import { EMPTY_SITE_META } from '../core/github/site-meta.constant';
import { EXISTING_SITE_META, VALID_SITE_META_TEXT } from '../core/github/site-meta.mock';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { AdminTokenService } from './admin-token.service';
import { PublishState } from './github-storage.enum';
import { SiteMetaService } from './site-meta.service';
import { SITE_META_LOAD_ERROR_PREFIX } from './site-meta.service.constant';
import {
  SITE_META_CDN_ERROR_MESSAGE,
  SITE_META_CDN_URL,
  SITE_META_NETWORK_ERROR_MESSAGE,
  SITE_META_SERVER_ERROR_STATUS,
  SITE_META_STORED_TOKEN,
  createSiteMetaSaveFetch,
} from './site-meta.service.mock';

describe('SiteMetaService', () => {
  const token = signal<string | null>(SITE_META_STORED_TOKEN);

  let service: SiteMetaService;

  beforeEach(() => {
    token.set(SITE_META_STORED_TOKEN);
    TestBed.configureTestingModule({
      providers: [{ provide: AdminTokenService, useValue: { token } }],
    });
    service = TestBed.inject(SiteMetaService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the meta from the CDN, falling back to the empty meta only on 404/403', async () => {
    const fetchMock = vi.fn();

    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce(new Response(VALID_SITE_META_TEXT));

    await expect(service.load()).resolves.toEqual(EXISTING_SITE_META);
    expect(fetchMock).toHaveBeenCalledWith(SITE_META_CDN_URL);

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_NOT_FOUND));

    await expect(service.load()).resolves.toEqual(EMPTY_SITE_META);

    fetchMock.mockResolvedValueOnce(statusResponse(HTTP_FORBIDDEN));

    await expect(service.load(), 'jsDelivr answers 403 for a never-published file').resolves.toEqual(EMPTY_SITE_META);

    fetchMock.mockResolvedValueOnce(statusResponse(SITE_META_SERVER_ERROR_STATUS));

    await expect(service.load()).rejects.toThrow(`${SITE_META_LOAD_ERROR_PREFIX}${SITE_META_SERVER_ERROR_STATUS}`);

    fetchMock.mockRejectedValueOnce(new Error(SITE_META_CDN_ERROR_MESSAGE));

    await expect(service.load()).rejects.toThrow(SITE_META_CDN_ERROR_MESSAGE);
  });

  it('saves through the github core, exposing the publishing state, and ignores a second save in flight', async () => {
    vi.stubGlobal('fetch', createSiteMetaSaveFetch());

    expect(service.state()).toBe(PublishState.idle);

    const saving = service.save(EXISTING_SITE_META);

    expect(service.state()).toBe(PublishState.publishing);

    await service.save(EXISTING_SITE_META);

    expect(service.state(), 'the second call starts no second commit cycle').toBe(PublishState.publishing);

    await saving;

    expect(service.state()).toBe(PublishState.success);
  });

  it('reports authError without a token or on 401 and error on any other failure', async () => {
    token.set(null);
    await service.save(EXISTING_SITE_META);

    expect(service.state()).toBe(PublishState.authError);

    token.set(SITE_META_STORED_TOKEN);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );
    await service.save(EXISTING_SITE_META);

    expect(service.state()).toBe(PublishState.authError);

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error(SITE_META_NETWORK_ERROR_MESSAGE))),
    );
    await service.save(EXISTING_SITE_META);

    expect(service.state()).toBe(PublishState.error);
  });
});
