import { Mock } from 'vitest';
import { EMPTY_INDEX, STALE_INDEX } from './archive-index.mock';
import { deleteEvent } from './delete-event';
import {
  DELETE_SHAS,
  DELETE_SLUG,
  DELETE_TOKEN,
  EXPECTED_DELETED_HISTORY,
  EXPECTED_DELETED_INDEX,
  EXPECTED_DELETE_COMMIT_MESSAGE,
  EXPECTED_DELETE_TREE_ENTRIES,
} from './delete-event.mock';
import {
  CONTENTS_REF_QUERY,
  GIT_BLOBS_URL,
  GIT_COMMITS_URL,
  GIT_TREES_URL,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  POST_METHOD,
  REPO_CONTENTS_URL,
} from './github-api.constant';
import { GitTreeEntry } from './github-api.interface';
import { OK_STATUS } from './github-commit.mock';
import { GithubAuthError } from './github-errors';
import { GithubFetchFn } from './github-fetch.type';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from './protocols-repo.constant';
import { EXISTING_HISTORY_TEXT, EXPECTED_PURGE_URLS } from './publish-event.mock';
import { createGitDataRoutes } from './spec-utils/git-data-routes';
import { RouteHandler, decodeBase64Json, requestBodiesOf, routeFetch, statusResponse } from './spec-utils/github-fetch-router';

const INDEX_CONTENTS_KEY = `GET ${REPO_CONTENTS_URL}${INDEX_JSON_PATH}${CONTENTS_REF_QUERY}`;

const ATHLETES_CONTENTS_KEY = `GET ${REPO_CONTENTS_URL}${ATHLETES_JSON_PATH}${CONTENTS_REF_QUERY}`;

function createDeleteFetch(indexText: string | null, historyText: string | null): Mock<GithubFetchFn> {
  const okPurgeRoutes = Object.fromEntries(
    EXPECTED_PURGE_URLS.map((url): [string, RouteHandler] => [`GET ${url}`, () => statusResponse(OK_STATUS)]),
  );

  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(DELETE_SHAS),
      ...okPurgeRoutes,
      [INDEX_CONTENTS_KEY]: () => (indexText === null ? statusResponse(HTTP_NOT_FOUND) : new Response(indexText)),
      [ATHLETES_CONTENTS_KEY]: () => (historyText === null ? statusResponse(HTTP_NOT_FOUND) : new Response(historyText)),
    }),
  );
}

/** Base64 blob contents in upload order: index.json, athletes.json — the deletions upload nothing. */
function blobContents(fetchFn: Mock<GithubFetchFn>): string[] {
  const bodies = requestBodiesOf<{ content: string }>(fetchFn.mock.calls, POST_METHOD, GIT_BLOBS_URL);

  return bodies.map((body) => body.content);
}

describe('deleteEvent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('atomically deletes the three event files, rewrites the summaries without the event and purges the CDN', async () => {
    const fetchFn = createDeleteFetch(JSON.stringify(STALE_INDEX), EXISTING_HISTORY_TEXT);

    await deleteEvent(DELETE_TOKEN, DELETE_SLUG, fetchFn);

    const contents = blobContents(fetchFn);
    const treeBodies = requestBodiesOf<{ tree: GitTreeEntry[] }>(fetchFn.mock.calls, POST_METHOD, GIT_TREES_URL);
    const commitBodies = requestBodiesOf(fetchFn.mock.calls, POST_METHOD, GIT_COMMITS_URL);
    const calledUrls = fetchFn.mock.calls.map(([url]) => url);

    expect(decodeBase64Json(contents[0]), 'the index entry is dropped').toEqual(EXPECTED_DELETED_INDEX);
    expect(decodeBase64Json(contents[1]), 'the rollup contribution is removed').toEqual(EXPECTED_DELETED_HISTORY);
    expect(treeBodies.map((body) => body.tree)).toEqual([EXPECTED_DELETE_TREE_ENTRIES]);
    expect(commitBodies).toMatchObject([{ message: EXPECTED_DELETE_COMMIT_MESSAGE }]);
    expect(calledUrls.filter((url) => EXPECTED_PURGE_URLS.includes(url))).toEqual(EXPECTED_PURGE_URLS);
  });

  it('still succeeds when the summaries have never been published, rewriting them as empty', async () => {
    const fetchFn = createDeleteFetch(null, null);

    await expect(deleteEvent(DELETE_TOKEN, DELETE_SLUG, fetchFn)).resolves.toBe(DELETE_SHAS.newCommitSha);

    const contents = blobContents(fetchFn);

    expect(decodeBase64Json(contents[0])).toEqual(EMPTY_INDEX);
    expect(decodeBase64Json(contents[1])).toEqual({});
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );

    await expect(deleteEvent(DELETE_TOKEN, DELETE_SLUG)).rejects.toBeInstanceOf(GithubAuthError);
  });
});
