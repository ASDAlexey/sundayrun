import { Mock } from 'vitest';
import {
  GIT_BLOBS_URL,
  GIT_COMMITS_URL,
  GIT_REF_UPDATE_URL,
  GIT_REF_URL,
  GIT_TREES_URL,
  HTTP_CONFLICT,
  HTTP_FORBIDDEN,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE,
  MAX_COMMIT_ATTEMPTS,
  PATCH_METHOD,
  POST_METHOD,
} from './github-api.constant';
import { commitFilesAtomically } from './github-commit';
import { COMMIT_RETRIES_EXHAUSTED_MESSAGE } from './github-commit.constant';
import {
  COMMIT_FILES,
  COMMIT_MESSAGE,
  COMMIT_TOKEN,
  EXPECTED_BLOB_BODIES,
  EXPECTED_COMMIT_BODY,
  EXPECTED_REF_UPDATE_BODY,
  EXPECTED_TREE_BODY,
  GIT_DATA_SHAS,
  HTTP_NOT_IMPLEMENTED,
  OK_STATUS,
} from './github-commit.mock';
import { GithubAuthError, GithubRequestError } from './github-errors';
import { GithubFetchFn } from './github-fetch.type';
import { createGitDataRoutes } from './spec-utils/git-data-routes';
import { RouteHandler, requestBodiesOf, routeFetch, statusResponse } from './spec-utils/github-fetch-router';

function createFetch(overrides: Record<string, RouteHandler> = {}): Mock<GithubFetchFn> {
  return vi.fn(routeFetch({ ...createGitDataRoutes(GIT_DATA_SHAS), ...overrides }));
}

function bodiesOf(fetchFn: Mock<GithubFetchFn>, method: string, url: string): unknown[] {
  return requestBodiesOf(fetchFn.mock.calls, method, url);
}

function refReads(fetchFn: Mock<GithubFetchFn>): number {
  return fetchFn.mock.calls.filter(([url]) => url === GIT_REF_URL).length;
}

describe('commitFilesAtomically', () => {
  const buildFiles = vi.fn(() => Promise.resolve(COMMIT_FILES));

  function commit(fetchFn: GithubFetchFn): Promise<string> {
    return commitFilesAtomically(COMMIT_TOKEN, buildFiles, COMMIT_MESSAGE, fetchFn);
  }

  beforeEach(() => {
    buildFiles.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs the ref → base commit → blobs → tree → commit → ref update cycle and returns the new sha', async () => {
    const fetchFn = createFetch();

    await expect(commit(fetchFn)).resolves.toBe(GIT_DATA_SHAS.newCommitSha);
    expect(buildFiles).toHaveBeenCalledTimes(1);
    expect(bodiesOf(fetchFn, POST_METHOD, GIT_BLOBS_URL)).toEqual(EXPECTED_BLOB_BODIES);
    expect(bodiesOf(fetchFn, POST_METHOD, GIT_TREES_URL)).toEqual([EXPECTED_TREE_BODY]);
    expect(bodiesOf(fetchFn, POST_METHOD, GIT_COMMITS_URL)).toEqual([EXPECTED_COMMIT_BODY]);
    expect(bodiesOf(fetchFn, PATCH_METHOD, GIT_REF_UPDATE_URL)).toEqual([EXPECTED_REF_UPDATE_BODY]);
  });

  it('maps 401/403 on any step to GithubAuthError', async () => {
    const unauthorizedRef = createFetch({ [`GET ${GIT_REF_URL}`]: () => statusResponse(HTTP_UNAUTHORIZED) });
    const forbiddenBlob = createFetch({ [`POST ${GIT_BLOBS_URL}`]: () => statusResponse(HTTP_FORBIDDEN) });
    const unauthorizedRefUpdate = createFetch({ [`PATCH ${GIT_REF_UPDATE_URL}`]: () => statusResponse(HTTP_UNAUTHORIZED) });

    await expect(commit(unauthorizedRef)).rejects.toBeInstanceOf(GithubAuthError);
    await expect(commit(forbiddenBlob)).rejects.toBeInstanceOf(GithubAuthError);
    await expect(commit(unauthorizedRefUpdate)).rejects.toBeInstanceOf(GithubAuthError);
  });

  it('maps other non-OK responses to GithubRequestError without retrying', async () => {
    const failingTree = createFetch({ [`POST ${GIT_TREES_URL}`]: () => statusResponse(HTTP_CONFLICT) });
    const failingRefUpdate = createFetch({ [`PATCH ${GIT_REF_UPDATE_URL}`]: () => statusResponse(HTTP_NOT_IMPLEMENTED) });

    await expect(commit(failingTree)).rejects.toBeInstanceOf(GithubRequestError);
    await expect(commit(failingRefUpdate)).rejects.toMatchObject({ status: HTTP_NOT_IMPLEMENTED });
    expect(refReads(failingTree)).toBe(1);
    expect(refReads(failingRefUpdate)).toBe(1);
  });

  it('re-reads the ref, rebuilds the files and retries the whole cycle when the ref update returns 409', async () => {
    let patchCalls = 0;
    const fetchFn = createFetch({
      [`PATCH ${GIT_REF_UPDATE_URL}`]: () => statusResponse(patchCalls++ === 0 ? HTTP_CONFLICT : OK_STATUS),
    });

    await expect(commit(fetchFn)).resolves.toBe(GIT_DATA_SHAS.newCommitSha);
    expect(refReads(fetchFn)).toBe(2);
    expect(buildFiles, 'files are rebuilt for every attempt').toHaveBeenCalledTimes(2);
  });

  it('gives up with GithubRequestError carrying the last ref status after exhausting the attempts on persistent 422', async () => {
    const fetchFn = createFetch({ [`PATCH ${GIT_REF_UPDATE_URL}`]: () => statusResponse(HTTP_UNPROCESSABLE) });

    await expect(commit(fetchFn)).rejects.toMatchObject({ message: COMMIT_RETRIES_EXHAUSTED_MESSAGE, status: HTTP_UNPROCESSABLE });
    expect(refReads(fetchFn)).toBe(MAX_COMMIT_ATTEMPTS);
    expect(buildFiles).toHaveBeenCalledTimes(MAX_COMMIT_ATTEMPTS);
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );

    await expect(commitFilesAtomically(COMMIT_TOKEN, buildFiles, COMMIT_MESSAGE)).rejects.toBeInstanceOf(GithubAuthError);
  });
});
