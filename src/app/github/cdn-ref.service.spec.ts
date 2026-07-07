import { TestBed } from '@angular/core/testing';

import { BRANCH_HEAD_ERROR_STATUS, BRANCH_HEAD_RESPONSE_TEXT, BRANCH_HEAD_SHA_MOCK } from '../core/github/branch-head.mock';
import { PROTOCOLS_REPO_BRANCH } from '../core/github/protocols-repo.constant';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { MALFORMED_VERSION_RESPONSE_TEXT, VERSION_POINTER_RESPONSE_TEXT, VERSION_POINTER_SHA_MOCK } from '../core/github/version-file.mock';
import { CdnRefService } from './cdn-ref.service';
import { CDN_REF_NETWORK_ERROR_MESSAGE, CDN_REF_SHA_MOCK, VERSION_POINTER_ERROR_STATUS } from './cdn-ref.service.mock';

describe('CdnRefService', () => {
  const fetchMock = vi.fn();

  let service: CdnRefService;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    service = TestBed.inject(CdnRefService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the version pointer once per session and pins to a just-created commit without refetching', async () => {
    fetchMock.mockResolvedValueOnce(new Response(VERSION_POINTER_RESPONSE_TEXT));

    await expect(service.resolve()).resolves.toBe(VERSION_POINTER_SHA_MOCK);
    await expect(service.resolve(), 'the second call reuses the cached lookup').resolves.toBe(VERSION_POINTER_SHA_MOCK);
    expect(fetchMock).toHaveBeenCalledTimes(1);

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
});
