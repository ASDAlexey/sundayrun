import { jsDelivrFileUrl, purgeJsDelivrPaths } from './jsdelivr';
import {
  CDN_FILE_PATH,
  EXPECTED_BRANCH_CDN_URL,
  EXPECTED_PINNED_CDN_URL,
  EXPECTED_PURGE_URLS,
  PINNED_REF,
  PURGE_PATHS,
  SERVER_ERROR_STATUS,
} from './jsdelivr.mock';
import { statusResponse } from './spec-utils/github-fetch-router';

describe('jsDelivrFileUrl', () => {
  it('builds the CDN url against the branch by default and against the given ref when pinned', () => {
    expect(jsDelivrFileUrl(CDN_FILE_PATH)).toBe(EXPECTED_BRANCH_CDN_URL);
    expect(jsDelivrFileUrl(CDN_FILE_PATH, PINNED_REF)).toBe(EXPECTED_PINNED_CDN_URL);
  });
});

describe('purgeJsDelivrPaths', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the purge url of every path and swallows both rejections and non-OK responses', async () => {
    const fetchFn = vi
      .fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(SERVER_ERROR_STATUS)))
      .mockRejectedValueOnce(new Error());

    await expect(purgeJsDelivrPaths(PURGE_PATHS, fetchFn)).resolves.toBeUndefined();
    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual(EXPECTED_PURGE_URLS);
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error())),
    );

    await expect(purgeJsDelivrPaths(PURGE_PATHS)).resolves.toBeUndefined();
  });
});
