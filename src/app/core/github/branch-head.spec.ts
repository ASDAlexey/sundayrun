import { fetchBranchHeadSha } from './branch-head';
import { BRANCH_HEAD_ERROR_STATUS, BRANCH_HEAD_RESPONSE_TEXT, BRANCH_HEAD_SHA_MOCK } from './branch-head.mock';
import { GIT_REF_URL, GITHUB_JSON_ACCEPT } from './github-api.constant';
import { GithubRequestError } from './github-errors';
import { statusResponse } from './spec-utils/github-fetch-router';

describe('fetchBranchHeadSha', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the branch head sha anonymously and throws on a non-OK response', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(new Response(BRANCH_HEAD_RESPONSE_TEXT));

    await expect(fetchBranchHeadSha(fetchFn)).resolves.toBe(BRANCH_HEAD_SHA_MOCK);
    expect(fetchFn).toHaveBeenCalledExactlyOnceWith(GIT_REF_URL, { headers: { Accept: GITHUB_JSON_ACCEPT } });

    fetchFn.mockResolvedValueOnce(statusResponse(BRANCH_HEAD_ERROR_STATUS));

    await expect(fetchBranchHeadSha(fetchFn)).rejects.toBeInstanceOf(GithubRequestError);
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(BRANCH_HEAD_RESPONSE_TEXT)));

    await expect(fetchBranchHeadSha()).resolves.toBe(BRANCH_HEAD_SHA_MOCK);
  });
});
