import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BRANCH_HEAD_ERROR_STATUS, BRANCH_HEAD_RESPONSE_TEXT, BRANCH_HEAD_SHA_MOCK } from '../core/github/branch-head.mock';
import { PROTOCOLS_REPO_BRANCH, VERSION_JSON_PATH } from '../core/github/protocols-repo.constant';
import { rawGithubFileUrl } from '../core/github/raw-github';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { CDN_REVALIDATE_FETCH_OPTIONS } from './cdn-fetch.constant';
import { MALFORMED_VERSION_RESPONSE_TEXT, VERSION_POINTER_RESPONSE_TEXT, VERSION_POINTER_SHA_MOCK } from '../core/github/version-file.mock';
import { CdnRefService } from './cdn-ref.service';
import { FRESH_SHA_STORAGE_KEY, FRESH_SHA_TTL_MS } from './cdn-ref.service.constant';
import {
  CDN_REF_NETWORK_ERROR_MESSAGE,
  CDN_REF_SHA_MOCK,
  MALFORMED_STORED_FRESH_RAWS,
  STORED_FRESH_SHA_MOCK,
  VERSION_POINTER_ERROR_STATUS,
  storedFreshShaRaw,
} from './cdn-ref.service.mock';

describe('CdnRefService', () => {
  const fetchMock = vi.fn();

  let service: CdnRefService;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.clear();
    service = TestBed.inject(CdnRefService);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  /** A fresh service instance — `resolve` memoizes per session, so re-reads need a new one. */
  function freshService(): CdnRefService {
    return TestBed.runInInjectionContext(() => new CdnRefService());
  }

  it('reads the version pointer once per session and pins to a just-created commit without refetching', async () => {
    fetchMock.mockResolvedValueOnce(new Response(VERSION_POINTER_RESPONSE_TEXT));

    await expect(service.resolve()).resolves.toBe(VERSION_POINTER_SHA_MOCK);
    await expect(service.resolve(), 'the second call reuses the cached lookup').resolves.toBe(VERSION_POINTER_SHA_MOCK);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock, 'the pointer is read from the raw branch url, not jsDelivr').toHaveBeenCalledWith(
      rawGithubFileUrl(VERSION_JSON_PATH),
      CDN_REVALIDATE_FETCH_OPTIONS,
    );

    service.pin(CDN_REF_SHA_MOCK);

    await expect(service.resolve(), 'a pinned commit needs no lookup').resolves.toBe(CDN_REF_SHA_MOCK);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the API head sha when the pointer file is missing', async () => {
    fetchMock
      .mockResolvedValueOnce(statusResponse(VERSION_POINTER_ERROR_STATUS))
      .mockResolvedValueOnce(new Response(BRANCH_HEAD_RESPONSE_TEXT));

    await expect(service.resolve()).resolves.toBe(BRANCH_HEAD_SHA_MOCK);
  });

  it('falls back to the API head sha when the pointer body is implausible', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(MALFORMED_VERSION_RESPONSE_TEXT))
      .mockResolvedValueOnce(new Response(BRANCH_HEAD_RESPONSE_TEXT));

    await expect(service.resolve()).resolves.toBe(BRANCH_HEAD_SHA_MOCK);
  });

  it('falls back to the branch ref for the session when both lookups fail', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error(CDN_REF_NETWORK_ERROR_MESSAGE))
      .mockResolvedValueOnce(statusResponse(BRANCH_HEAD_ERROR_STATUS));

    await expect(service.resolve()).resolves.toBe(PROTOCOLS_REPO_BRANCH);
    await expect(service.resolve(), 'the fallback is cached too').resolves.toBe(PROTOCOLS_REPO_BRANCH);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('a noted fresh sha wins over the pointer for the next session within its TTL', async () => {
    service.noteFreshSha(STORED_FRESH_SHA_MOCK);

    await expect(freshService().resolve(), 'the remembered sha spares the stale raw read').resolves.toBe(STORED_FRESH_SHA_MOCK);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores an expired, implausible or malformed remembered sha and reads the pointer', async () => {
    const staleRaws = [
      ...MALFORMED_STORED_FRESH_RAWS,
      storedFreshShaRaw(STORED_FRESH_SHA_MOCK, Date.now() - FRESH_SHA_TTL_MS - 1),
      storedFreshShaRaw(CDN_REF_SHA_MOCK, Date.now()),
    ];

    for (const raw of staleRaws) {
      sessionStorage.setItem(FRESH_SHA_STORAGE_KEY, raw);
      fetchMock.mockResolvedValueOnce(new Response(VERSION_POINTER_RESPONSE_TEXT));

      await expect(freshService().resolve(), `\`${raw}\` must fall back to the pointer`).resolves.toBe(VERSION_POINTER_SHA_MOCK);
    }
  });

  it('swallows storage failures: noting stays silent and resolving falls back to the pointer', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error(CDN_REF_NETWORK_ERROR_MESSAGE);
    });
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error(CDN_REF_NETWORK_ERROR_MESSAGE);
    });

    try {
      expect(() => service.noteFreshSha(STORED_FRESH_SHA_MOCK), 'quota or privacy mode never breaks a publish').not.toThrow();

      fetchMock.mockResolvedValueOnce(new Response(VERSION_POINTER_RESPONSE_TEXT));

      await expect(freshService().resolve()).resolves.toBe(VERSION_POINTER_SHA_MOCK);
    } finally {
      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
    }
  });
});

describe('CdnRefService without a window', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves through the pointer and keeps noteFreshSha inert, so a prerender never throws', async () => {
    const service = TestBed.inject(CdnRefService);

    expect(() => service.noteFreshSha(STORED_FRESH_SHA_MOCK)).not.toThrow();

    fetchMock.mockResolvedValueOnce(new Response(VERSION_POINTER_RESPONSE_TEXT));

    await expect(service.resolve()).resolves.toBe(VERSION_POINTER_SHA_MOCK);
  });
});
