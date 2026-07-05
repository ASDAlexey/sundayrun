import { GIT_BLOBS_URL, GIT_COMMITS_URL, GIT_TREES_URL, HTTP_UNAUTHORIZED, POST_METHOD } from './github-api.constant';
import { OK_STATUS } from './github-commit.mock';
import { GithubAuthError } from './github-errors';
import { SITE_META_JSON_PATH } from './protocols-repo.constant';
import { publishSiteMeta } from './publish-site-meta';
import { SITE_META_COMMIT_MESSAGE } from './publish-site-meta.constant';
import { EXPECTED_SITE_META_PURGE_URL, SITE_META_SHAS, SITE_META_TOKEN } from './publish-site-meta.mock';
import { EXISTING_SITE_META } from './site-meta.mock';
import { createGitDataRoutes } from './spec-utils/git-data-routes';
import { decodeBase64Json, requestBodiesOf, routeFetch, statusResponse } from './spec-utils/github-fetch-router';

describe('publishSiteMeta', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('commits the single meta file, purges its CDN path and returns the commit sha', async () => {
    const fetchFn = vi.fn(
      routeFetch({
        ...createGitDataRoutes(SITE_META_SHAS),
        [`GET ${EXPECTED_SITE_META_PURGE_URL}`]: () => statusResponse(OK_STATUS),
      }),
    );

    await expect(publishSiteMeta(SITE_META_TOKEN, EXISTING_SITE_META, fetchFn)).resolves.toBe(SITE_META_SHAS.newCommitSha);

    const blobBodies = requestBodiesOf<{ content: string }>(fetchFn.mock.calls, POST_METHOD, GIT_BLOBS_URL);
    const treeBodies = requestBodiesOf<{ tree: { path: string }[] }>(fetchFn.mock.calls, POST_METHOD, GIT_TREES_URL);
    const commitBodies = requestBodiesOf(fetchFn.mock.calls, POST_METHOD, GIT_COMMITS_URL);
    const calledUrls = fetchFn.mock.calls.map(([url]) => url);

    expect(decodeBase64Json(blobBodies[0].content)).toEqual(EXISTING_SITE_META);
    expect(treeBodies[0].tree.map((entry) => entry.path)).toEqual([SITE_META_JSON_PATH]);
    expect(commitBodies).toMatchObject([{ message: SITE_META_COMMIT_MESSAGE }]);
    expect(calledUrls).toContain(EXPECTED_SITE_META_PURGE_URL);
  });

  it('falls back to the global fetch by default and surfaces auth failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );

    await expect(publishSiteMeta(SITE_META_TOKEN, EXISTING_SITE_META)).rejects.toBeInstanceOf(GithubAuthError);
  });
});
