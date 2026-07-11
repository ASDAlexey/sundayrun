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
  CONTENTS_REF_QUERY,
  GIT_BLOBS_URL,
  GIT_COMMITS_URL,
  GIT_REF_UPDATE_URL,
  GIT_TREES_URL,
  HTTP_CONFLICT,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  POST_METHOD,
  REPO_CONTENTS_URL,
} from './github-api.constant';
import { OK_STATUS } from './github-commit.mock';
import { GithubAuthError } from './github-errors';
import { GithubFetchFn } from './github-fetch.type';
import { JSDELIVR_PURGE_BASE_URL } from './jsdelivr.constant';
import { CURRENT_DB_BYTES, DB_CONTENTS_KEY } from './protocol-db-file.mock';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH, VERSION_JSON_PATH } from './protocols-repo.constant';
import { publishEvent } from './publish-event';
import {
  CONCURRENT_INDEX_TEXT,
  EXISTING_HISTORY_TEXT,
  EXISTING_INDEX_TEXT,
  EXPECTED_COMMIT_MESSAGE,
  EXPECTED_COMMIT_PATHS,
  EXPECTED_COMMIT_PATHS_WITHOUT_DB,
  EXPECTED_FIRST_PUBLISH_HISTORY,
  EXPECTED_FIRST_PUBLISH_INDEX,
  EXPECTED_MERGED_INDEX,
  EXPECTED_PUBLISHED_HISTORY,
  EXPECTED_PUBLISHED_INDEX,
  PUBLISH_INPUT,
  PUBLISH_SHAS,
  PUBLISH_TOKEN,
  SOURCE_XLSX_BYTES,
} from './publish-event.mock';
import { RESULTS_FILE_SCHEMA_VERSION } from './results-file.constant';
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
import { PROTOCOL_ROWS, RACE_EVENT } from './spec-utils/race-fixtures';
import { VERSION_FILE_SCHEMA_VERSION } from './version-file.constant';
import { EXPECTED_VERSION_COMMIT_MESSAGE, EXPECTED_VERSION_PURGE_URL, POINTER_COMMIT_SHA_MOCK } from './version-pointer.mock';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const fake = await import('../sqlite/spec-utils/fake-sqlite3');

  return { default: () => Promise.resolve(fake.FAKE_SQLITE3) };
});

const INDEX_CONTENTS_KEY = `GET ${REPO_CONTENTS_URL}${INDEX_JSON_PATH}${CONTENTS_REF_QUERY}`;

const ATHLETES_CONTENTS_KEY = `GET ${REPO_CONTENTS_URL}${ATHLETES_JSON_PATH}${CONTENTS_REF_QUERY}`;

function createPublishFetch(
  indexText: string | null,
  historyText: string | null,
  overrides: Record<string, RouteHandler> = {},
): Mock<GithubFetchFn> {
  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(PUBLISH_SHAS),
      [`GET ${EXPECTED_VERSION_PURGE_URL}`]: () => statusResponse(OK_STATUS),
      [INDEX_CONTENTS_KEY]: () => (indexText === null ? statusResponse(HTTP_NOT_FOUND) : new Response(indexText)),
      [ATHLETES_CONTENTS_KEY]: () => (historyText === null ? statusResponse(HTTP_NOT_FOUND) : new Response(historyText)),
      [DB_CONTENTS_KEY]: () => new Response(CURRENT_DB_BYTES),
      ...overrides,
    }),
  );
}

/** Base64 blob contents in upload order: source.xlsx, results.json, index.json, athletes.json, protocol.db, version.json. */
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

  it('commits all five files atomically, publishes the version pointer and returns the data commit sha', async () => {
    let commitCalls = 0;
    const fetchFn = createPublishFetch(EXISTING_INDEX_TEXT, EXISTING_HISTORY_TEXT, {
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

    expect(result, 'the data commit sha, not the pointer commit sha, and no dbSkipped warning').toEqual({
      commitSha: PUBLISH_SHAS.newCommitSha,
    });
    expect(decodeBase64Bytes(contents[0])).toEqual(SOURCE_XLSX_BYTES);
    expect(decodeBase64Json(contents[1])).toEqual({ schemaVersion: RESULTS_FILE_SCHEMA_VERSION, event: RACE_EVENT, rows: PROTOCOL_ROWS });
    expect(decodeBase64Json(contents[2]), 'stale index entry is replaced and re-sorted').toEqual(EXPECTED_PUBLISHED_INDEX);
    expect(decodeBase64Json(contents[3]), 'stale rollup contribution is replaced').toEqual(EXPECTED_PUBLISHED_HISTORY);
    expect(decodeBase64Bytes(contents[4]), 'the derived db rebuilt in wasm').toEqual(FAKE_EXPORTED_BYTES);
    expect(ALLOC_FROM_TYPED_ARRAY_MOCK, 'the downloaded db bytes reach the wasm rebuild').toHaveBeenCalledWith(CURRENT_DB_BYTES);
    expect(decodeBase64Json(contents[5]), 'the pointer names the data commit').toEqual({
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

  it('starts from an empty index, history and a fresh db when none of the repository files exists yet', async () => {
    const fetchFn = createPublishFetch(null, null, { [DB_CONTENTS_KEY]: () => statusResponse(HTTP_NOT_FOUND) });

    await expect(publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, fetchFn)).resolves.toEqual({
      commitSha: PUBLISH_SHAS.newCommitSha,
    });

    const contents = blobContents(fetchFn);

    expect(contents).toHaveLength(EXPECTED_COMMIT_PATHS.length + 1);
    expect(decodeBase64Json(contents[2])).toEqual(EXPECTED_FIRST_PUBLISH_INDEX);
    expect(decodeBase64Json(contents[3])).toEqual(EXPECTED_FIRST_PUBLISH_HISTORY);
    expect(decodeBase64Bytes(contents[4])).toEqual(FAKE_EXPORTED_BYTES);
    expect(SQLITE3_DESERIALIZE_MOCK, 'a missing db is created from scratch instead of deserialized').not.toHaveBeenCalled();
  });

  it('rebuilds the files from fresh repository reads on retry, so a concurrent publication survives', async () => {
    let indexReads = 0;
    let refUpdates = 0;
    const fetchFn = createPublishFetch(EXISTING_INDEX_TEXT, EXISTING_HISTORY_TEXT, {
      [INDEX_CONTENTS_KEY]: () => new Response(indexReads++ === 0 ? EXISTING_INDEX_TEXT : CONCURRENT_INDEX_TEXT),
      [`PATCH ${GIT_REF_UPDATE_URL}`]: () => statusResponse(refUpdates++ === 0 ? HTTP_CONFLICT : OK_STATUS),
    });

    const result = await publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, fetchFn);
    const contents = blobContents(fetchFn);

    expect(result.commitSha).toBe(PUBLISH_SHAS.newCommitSha);
    expect(contents, 'all six files are rebuilt and re-uploaded on the retry, then the pointer follows').toHaveLength(
      EXPECTED_COMMIT_PATHS.length * 2 + 1,
    );
    expect(decodeBase64Json(contents[contents.length - 4]), 'the concurrent index entry is kept').toEqual(EXPECTED_MERGED_INDEX);
    expect(FAKE_SQLITE3_STATE.dbs, 'the db is re-downloaded and re-applied per attempt').toHaveLength(2);
  });

  it('still publishes when the db rebuild fails, committing the five json files and flagging dbSkipped', async () => {
    FAKE_SQLITE3_STATE.deserializeRc = SQLITE_ERROR_RC;
    const fetchFn = createPublishFetch(EXISTING_INDEX_TEXT, EXISTING_HISTORY_TEXT);

    const result = await publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, fetchFn);
    const treeBodies = requestBodiesOf<{ tree: { path: string }[] }>(fetchFn.mock.calls, POST_METHOD, GIT_TREES_URL);

    expect(result).toEqual({ commitSha: PUBLISH_SHAS.newCommitSha, dbSkipped: true });
    expect(
      treeBodies[0].tree.map((entry) => entry.path),
      'json stays the source of truth',
    ).toEqual(EXPECTED_COMMIT_PATHS_WITHOUT_DB);
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );

    await expect(publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT)).rejects.toBeInstanceOf(GithubAuthError);
  });
});
