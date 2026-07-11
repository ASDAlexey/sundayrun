import { Mock } from 'vitest';
import {
  ALLOC_FROM_TYPED_ARRAY_MOCK,
  FAKE_EXPORTED_BYTES,
  FAKE_SQLITE3_STATE,
  SQLITE3_DESERIALIZE_MOCK,
  SQLITE_ERROR_RC,
  resetFakeSqlite3,
} from '../sqlite/spec-utils/fake-sqlite3';
import {
  GIT_BLOBS_URL,
  GIT_COMMITS_URL,
  GIT_REF_UPDATE_URL,
  GIT_TREES_URL,
  HTTP_CONFLICT,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  POST_METHOD,
} from './github-api.constant';
import { OK_STATUS } from './github-commit.mock';
import { GithubAuthError } from './github-errors';
import { GithubFetchFn } from './github-fetch.type';
import { JSDELIVR_PURGE_BASE_URL } from './jsdelivr.constant';
import { CURRENT_DB_BYTES, DB_CONTENTS_KEY } from './protocol-db-file.mock';
import { VERSION_JSON_PATH } from './protocols-repo.constant';
import { publishEvent } from './publish-event';
import {
  EXPECTED_COMMIT_MESSAGE,
  EXPECTED_COMMIT_PATHS,
  PUBLISH_INPUT,
  PUBLISH_SHAS,
  PUBLISH_TOKEN,
  SOURCE_XLSX_BYTES,
} from './publish-event.mock';
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

function createPublishFetch(overrides: Record<string, RouteHandler> = {}): Mock<GithubFetchFn> {
  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(PUBLISH_SHAS),
      [`GET ${EXPECTED_VERSION_PURGE_URL}`]: () => statusResponse(OK_STATUS),
      [DB_CONTENTS_KEY]: () => new Response(CURRENT_DB_BYTES),
      ...overrides,
    }),
  );
}

/** Base64 blob contents in upload order: source.xlsx, protocol.db, then the version pointer's version.json. */
function blobContents(fetchFn: Mock<GithubFetchFn>): string[] {
  const bodies = requestBodiesOf<{ content: string }>(fetchFn.mock.calls, POST_METHOD, GIT_BLOBS_URL);

  return bodies.map((body) => body.content);
}

describe('publishEvent', () => {
  beforeEach(() => {
    resetFakeSqlite3();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('commits the source workbook and the derived db atomically, publishes the version pointer and returns the data commit sha', async () => {
    let commitCalls = 0;
    const fetchFn = createPublishFetch({
      [`POST ${GIT_COMMITS_URL}`]: () =>
        jsonResponse({
          sha: commitCalls++ === 0 ? PUBLISH_SHAS.newCommitSha : POINTER_COMMIT_SHA_MOCK,
          tree: { sha: PUBLISH_SHAS.treeSha },
        }),
    });

    const result = await publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, fetchFn);

    const contents = blobContents(fetchFn);
    const commitBodies = requestBodiesOf(fetchFn.mock.calls, POST_METHOD, GIT_COMMITS_URL);
    const treeBodies = requestBodiesOf<{ tree: { path: string }[] }>(fetchFn.mock.calls, POST_METHOD, GIT_TREES_URL);
    const treePaths = treeBodies.map((body) => body.tree.map((entry) => entry.path));
    const calledUrls = fetchFn.mock.calls.map(([url]) => url);

    expect(result, 'the data commit sha, not the pointer commit sha').toEqual({ commitSha: PUBLISH_SHAS.newCommitSha });
    expect(decodeBase64Bytes(contents[0])).toEqual(SOURCE_XLSX_BYTES);
    expect(decodeBase64Bytes(contents[1]), 'the derived db rebuilt in wasm').toEqual(FAKE_EXPORTED_BYTES);
    expect(ALLOC_FROM_TYPED_ARRAY_MOCK, 'the downloaded db bytes reach the wasm rebuild').toHaveBeenCalledWith(CURRENT_DB_BYTES);
    expect(decodeBase64Json(contents[2]), 'the pointer names the data commit').toEqual({
      schemaVersion: VERSION_FILE_SCHEMA_VERSION,
      sha: PUBLISH_SHAS.newCommitSha,
    });
    expect(commitBodies).toMatchObject([{ message: EXPECTED_COMMIT_MESSAGE }, { message: EXPECTED_VERSION_COMMIT_MESSAGE }]);
    expect(treePaths).toEqual([EXPECTED_COMMIT_PATHS, [VERSION_JSON_PATH]]);
    expect(
      calledUrls.filter((url) => url.startsWith(JSDELIVR_PURGE_BASE_URL)),
      'sha-pinned data urls never need a purge',
    ).toEqual([EXPECTED_VERSION_PURGE_URL]);
  });

  it('creates a fresh db from scratch when none is published yet', async () => {
    const fetchFn = createPublishFetch({ [DB_CONTENTS_KEY]: () => statusResponse(HTTP_NOT_FOUND) });

    await expect(publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, fetchFn)).resolves.toEqual({ commitSha: PUBLISH_SHAS.newCommitSha });

    const contents = blobContents(fetchFn);

    expect(contents).toHaveLength(EXPECTED_COMMIT_PATHS.length + 1);
    expect(decodeBase64Bytes(contents[1])).toEqual(FAKE_EXPORTED_BYTES);
    expect(SQLITE3_DESERIALIZE_MOCK, 'a missing db is created from scratch instead of deserialized').not.toHaveBeenCalled();
  });

  it('rebuilds from a fresh db download on retry, so a concurrent publication survives', async () => {
    let refUpdates = 0;
    const fetchFn = createPublishFetch({
      [`PATCH ${GIT_REF_UPDATE_URL}`]: () => statusResponse(refUpdates++ === 0 ? HTTP_CONFLICT : OK_STATUS),
    });

    const result = await publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, fetchFn);
    const contents = blobContents(fetchFn);

    expect(result.commitSha).toBe(PUBLISH_SHAS.newCommitSha);
    expect(contents, 'both files are rebuilt and re-uploaded on the retry, then the pointer follows').toHaveLength(
      EXPECTED_COMMIT_PATHS.length * 2 + 1,
    );
    expect(FAKE_SQLITE3_STATE.dbs, 'the db is re-downloaded and re-applied per attempt').toHaveLength(2);
  });

  it('fails the publication when the db cannot be rebuilt, since it is now the source of truth', async () => {
    FAKE_SQLITE3_STATE.deserializeRc = SQLITE_ERROR_RC;

    await expect(publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, createPublishFetch())).rejects.toThrow(String(SQLITE_ERROR_RC));
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );

    await expect(publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT)).rejects.toBeInstanceOf(GithubAuthError);
  });
});
