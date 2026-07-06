import { TestBed } from '@angular/core/testing';

import { BRANCH_HEAD_ERROR_STATUS, BRANCH_HEAD_RESPONSE_TEXT, BRANCH_HEAD_SHA_MOCK } from '../core/github/branch-head.mock';
import { PROTOCOLS_REPO_BRANCH } from '../core/github/protocols-repo.constant';
import { statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { CdnRefService } from './cdn-ref.service';
import { CDN_REF_SHA_MOCK } from './cdn-ref.service.mock';

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

  it('reads the head sha once per session and pins to a just-created commit without refetching', async () => {
    fetchMock.mockResolvedValueOnce(new Response(BRANCH_HEAD_RESPONSE_TEXT));

    await expect(service.resolve()).resolves.toBe(BRANCH_HEAD_SHA_MOCK);
    await expect(service.resolve(), 'the second call reuses the cached lookup').resolves.toBe(BRANCH_HEAD_SHA_MOCK);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    service.pin(CDN_REF_SHA_MOCK);

    await expect(service.resolve(), 'a pinned commit needs no lookup').resolves.toBe(CDN_REF_SHA_MOCK);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the branch ref for the session when the head lookup fails', async () => {
    fetchMock.mockResolvedValueOnce(statusResponse(BRANCH_HEAD_ERROR_STATUS));

    await expect(service.resolve()).resolves.toBe(PROTOCOLS_REPO_BRANCH);
    await expect(service.resolve(), 'the fallback is cached too').resolves.toBe(PROTOCOLS_REPO_BRANCH);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
