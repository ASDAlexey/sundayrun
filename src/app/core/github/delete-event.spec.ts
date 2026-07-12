import { Mock } from 'vitest';
import {
  ALLOC_FROM_TYPED_ARRAY_MOCK,
  FAKE_EXPORTED_BYTES,
  FAKE_SQLITE3_STATE,
  SQLITE3_DESERIALIZE_MOCK,
  SQLITE_ERROR_RC,
  resetFakeSqlite3,
} from '../sqlite/spec-utils/fake-sqlite3';
import { deleteEvent } from './delete-event';
import { DELETE_SHAS, DELETE_SLUG, DELETE_TOKEN, EXPECTED_DELETE_COMMIT_MESSAGE, EXPECTED_DELETE_TREE_ENTRIES } from './delete-event.mock';
import { GIT_BLOBS_URL, GIT_COMMITS_URL, GIT_TREES_URL, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED, POST_METHOD } from './github-api.constant';
import { GitTreeEntry } from './github-api.interface';
import { OK_STATUS } from './github-commit.mock';
import { GithubAuthError } from './github-errors';
import { GithubFetchFn } from './github-fetch.type';
import { JSDELIVR_PURGE_BASE_URL } from './jsdelivr.constant';
import { CURRENT_DB_BYTES, DB_CONTENTS_KEY } from './protocol-db-file.mock';
import { VERSION_JSON_PATH } from './protocols-repo.constant';
import { createGitDataRoutes } from './spec-utils/git-data-routes';
import {
  RouteHandler,
  decodeBase64Bytes,
  decodeBase64Json,
  jsonResponse,
  requestBodiesOf,
  routeFetch,
  statusResponse,
} from './spec-utils/github-fetch-router';
import { VERSION_FILE_SCHEMA_VERSION } from './version-file.constant';
import { EXPECTED_VERSION_COMMIT_MESSAGE, EXPECTED_VERSION_PURGE_URL, POINTER_COMMIT_SHA_MOCK } from './version-pointer.mock';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const fake = await import('../sqlite/spec-utils/fake-sqlite3');

  return { default: () => Promise.resolve(fake.FAKE_SQLITE3) };
});

function createDeleteFetch(overrides: Record<string, RouteHandler> = {}): Mock<GithubFetchFn> {
  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(DELETE_SHAS),
      [`GET ${EXPECTED_VERSION_PURGE_URL}`]: () => statusResponse(OK_STATUS),
      [DB_CONTENTS_KEY]: () => new Response(CURRENT_DB_BYTES),
      ...overrides,
    }),
  );
}

/** Base64 blob contents in upload order: sundayrun.db, then the version pointer's version.json — the deletion uploads nothing. */
function blobContents(fetchFn: Mock<GithubFetchFn>): string[] {
  const bodies = requestBodiesOf<{ content: string }>(fetchFn.mock.calls, POST_METHOD, GIT_BLOBS_URL);

  return bodies.map((body) => body.content);
}

describe('deleteEvent', () => {
  beforeEach(() => {
    resetFakeSqlite3();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('atomically deletes the source workbook, rewrites the db and publishes the version pointer', async () => {
    let commitCalls = 0;
    const fetchFn = createDeleteFetch({
      [`POST ${GIT_COMMITS_URL}`]: () =>
        jsonResponse({ sha: commitCalls++ === 0 ? DELETE_SHAS.newCommitSha : POINTER_COMMIT_SHA_MOCK, tree: { sha: DELETE_SHAS.treeSha } }),
    });

    await expect(deleteEvent(DELETE_TOKEN, DELETE_SLUG, fetchFn), 'the data commit sha, not the pointer commit sha').resolves.toBe(
      DELETE_SHAS.newCommitSha,
    );

    const contents = blobContents(fetchFn);
    const treeBodies = requestBodiesOf<{ tree: GitTreeEntry[] }>(fetchFn.mock.calls, POST_METHOD, GIT_TREES_URL);
    const commitBodies = requestBodiesOf(fetchFn.mock.calls, POST_METHOD, GIT_COMMITS_URL);
    const calledUrls = fetchFn.mock.calls.map(([url]) => url);

    expect(decodeBase64Bytes(contents[0]), 'the derived db is rewritten, not deleted').toEqual(FAKE_EXPORTED_BYTES);
    expect(ALLOC_FROM_TYPED_ARRAY_MOCK, 'the downloaded db bytes reach the wasm rebuild').toHaveBeenCalledWith(CURRENT_DB_BYTES);
    expect(decodeBase64Json(contents[1]), 'the pointer names the deletion commit').toEqual({
      schemaVersion: VERSION_FILE_SCHEMA_VERSION,
      sha: DELETE_SHAS.newCommitSha,
    });
    expect(treeBodies[0].tree).toEqual(EXPECTED_DELETE_TREE_ENTRIES);
    expect(treeBodies[1].tree.map((entry) => entry.path)).toEqual([VERSION_JSON_PATH]);
    expect(commitBodies).toMatchObject([{ message: EXPECTED_DELETE_COMMIT_MESSAGE }, { message: EXPECTED_VERSION_COMMIT_MESSAGE }]);
    expect(
      calledUrls.filter((url) => url.startsWith(JSDELIVR_PURGE_BASE_URL)),
      'sha-pinned data urls never need a purge',
    ).toEqual([EXPECTED_VERSION_PURGE_URL]);
  });

  it('still succeeds when no db is published yet, rewriting it from scratch', async () => {
    const fetchFn = createDeleteFetch({ [DB_CONTENTS_KEY]: () => statusResponse(HTTP_NOT_FOUND) });

    await expect(deleteEvent(DELETE_TOKEN, DELETE_SLUG, fetchFn)).resolves.toBe(DELETE_SHAS.newCommitSha);

    const contents = blobContents(fetchFn);

    expect(decodeBase64Bytes(contents[0])).toEqual(FAKE_EXPORTED_BYTES);
    expect(SQLITE3_DESERIALIZE_MOCK, 'a missing db is rebuilt from scratch instead of deserialized').not.toHaveBeenCalled();
  });

  it('fails the deletion when the db cannot be rebuilt, since it is now the source of truth', async () => {
    FAKE_SQLITE3_STATE.deserializeRc = SQLITE_ERROR_RC;

    await expect(deleteEvent(DELETE_TOKEN, DELETE_SLUG, createDeleteFetch())).rejects.toThrow(String(SQLITE_ERROR_RC));
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );

    await expect(deleteEvent(DELETE_TOKEN, DELETE_SLUG)).rejects.toBeInstanceOf(GithubAuthError);
  });
});
