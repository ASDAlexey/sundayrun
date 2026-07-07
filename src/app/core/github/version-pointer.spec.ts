import { GIT_BLOBS_URL, GIT_COMMITS_URL, GIT_TREES_URL, HTTP_UNAUTHORIZED, POST_METHOD } from './github-api.constant';
import { OK_STATUS } from './github-commit.mock';
import { GithubAuthError } from './github-errors';
import { VERSION_JSON_PATH } from './protocols-repo.constant';
import { createGitDataRoutes } from './spec-utils/git-data-routes';
import { decodeBase64Json, requestBodiesOf, routeFetch, statusResponse } from './spec-utils/github-fetch-router';
import { VERSION_FILE_SCHEMA_VERSION } from './version-file.constant';
import { publishVersionPointer } from './version-pointer';
import {
  DATA_COMMIT_SHA_MOCK,
  EXPECTED_VERSION_COMMIT_MESSAGE,
  EXPECTED_VERSION_PURGE_URL,
  VERSION_POINTER_SHAS,
  VERSION_POINTER_SLUG,
  VERSION_POINTER_TOKEN,
} from './version-pointer.mock';

describe('publishVersionPointer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('commits the pointer file at the data commit sha and purges only its CDN path', async () => {
    const fetchFn = vi.fn(
      routeFetch({
        ...createGitDataRoutes(VERSION_POINTER_SHAS),
        [`GET ${EXPECTED_VERSION_PURGE_URL}`]: () => statusResponse(OK_STATUS),
      }),
    );

    await publishVersionPointer(VERSION_POINTER_TOKEN, VERSION_POINTER_SLUG, DATA_COMMIT_SHA_MOCK, fetchFn);

    const blobBodies = requestBodiesOf<{ content: string }>(fetchFn.mock.calls, POST_METHOD, GIT_BLOBS_URL);
    const treeBodies = requestBodiesOf<{ tree: { path: string }[] }>(fetchFn.mock.calls, POST_METHOD, GIT_TREES_URL);
    const commitBodies = requestBodiesOf(fetchFn.mock.calls, POST_METHOD, GIT_COMMITS_URL);
    const calledUrls = fetchFn.mock.calls.map(([url]) => url);

    expect(decodeBase64Json(blobBodies[0].content)).toEqual({ schemaVersion: VERSION_FILE_SCHEMA_VERSION, sha: DATA_COMMIT_SHA_MOCK });
    expect(treeBodies[0].tree.map((entry) => entry.path)).toEqual([VERSION_JSON_PATH]);
    expect(commitBodies).toMatchObject([{ message: EXPECTED_VERSION_COMMIT_MESSAGE }]);
    expect(calledUrls).toContain(EXPECTED_VERSION_PURGE_URL);
  });

  it('falls back to the global fetch by default and surfaces a pointer commit failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );

    await expect(publishVersionPointer(VERSION_POINTER_TOKEN, VERSION_POINTER_SLUG, DATA_COMMIT_SHA_MOCK)).rejects.toBeInstanceOf(
      GithubAuthError,
    );
  });
});
