import { Mock } from 'vitest';
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
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from './protocols-repo.constant';
import { publishEvent } from './publish-event';
import {
  CONCURRENT_INDEX_TEXT,
  EXISTING_HISTORY_TEXT,
  EXISTING_INDEX_TEXT,
  EXPECTED_COMMIT_MESSAGE,
  EXPECTED_COMMIT_PATHS,
  EXPECTED_FIRST_PUBLISH_HISTORY,
  EXPECTED_FIRST_PUBLISH_INDEX,
  EXPECTED_MERGED_INDEX,
  EXPECTED_PDF_URL,
  EXPECTED_PUBLISHED_HISTORY,
  EXPECTED_PUBLISHED_INDEX,
  EXPECTED_PURGE_URLS,
  PDF_BYTES,
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
  requestBodiesOf,
  routeFetch,
  statusResponse,
} from './spec-utils/github-fetch-router';
import { PROTOCOL_ROWS, RACE_EVENT } from './spec-utils/race-fixtures';

const INDEX_CONTENTS_KEY = `GET ${REPO_CONTENTS_URL}${INDEX_JSON_PATH}${CONTENTS_REF_QUERY}`;

const ATHLETES_CONTENTS_KEY = `GET ${REPO_CONTENTS_URL}${ATHLETES_JSON_PATH}${CONTENTS_REF_QUERY}`;

function createPublishFetch(
  indexText: string | null,
  historyText: string | null,
  overrides: Record<string, RouteHandler> = {},
): Mock<GithubFetchFn> {
  const okPurgeRoutes = Object.fromEntries(EXPECTED_PURGE_URLS.map((url) => [`GET ${url}`, (): Response => statusResponse(OK_STATUS)]));

  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(PUBLISH_SHAS),
      ...okPurgeRoutes,
      [INDEX_CONTENTS_KEY]: () => (indexText === null ? statusResponse(HTTP_NOT_FOUND) : new Response(indexText)),
      [ATHLETES_CONTENTS_KEY]: () => (historyText === null ? statusResponse(HTTP_NOT_FOUND) : new Response(historyText)),
      ...overrides,
    }),
  );
}

/** Base64 blob contents in upload order: source.xlsx, protocol.pdf, results.json, index.json, athletes.json. */
function blobContents(fetchFn: Mock<GithubFetchFn>): string[] {
  const bodies = requestBodiesOf<{ content: string }>(fetchFn.mock.calls, POST_METHOD, GIT_BLOBS_URL);

  return bodies.map((body) => body.content);
}

describe('publishEvent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('commits all five files atomically, purges the CDN and returns a sha-pinned pdf url', async () => {
    const fetchFn = createPublishFetch(EXISTING_INDEX_TEXT, EXISTING_HISTORY_TEXT);

    const result = await publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, fetchFn);

    const contents = blobContents(fetchFn);
    const commitBody = requestBodiesOf(fetchFn.mock.calls, POST_METHOD, GIT_COMMITS_URL);
    const treeBodies = requestBodiesOf<{ tree: { path: string }[] }>(fetchFn.mock.calls, POST_METHOD, GIT_TREES_URL);
    const treePaths = treeBodies.map((body) => body.tree.map((entry) => entry.path));
    const calledUrls = fetchFn.mock.calls.map(([url]) => url);

    expect(result).toEqual({ commitSha: PUBLISH_SHAS.newCommitSha, pdfUrl: EXPECTED_PDF_URL });
    expect(decodeBase64Bytes(contents[0])).toEqual(SOURCE_XLSX_BYTES);
    expect(decodeBase64Bytes(contents[1])).toEqual(PDF_BYTES);
    expect(decodeBase64Json(contents[2])).toEqual({ schemaVersion: RESULTS_FILE_SCHEMA_VERSION, event: RACE_EVENT, rows: PROTOCOL_ROWS });
    expect(decodeBase64Json(contents[3]), 'stale index entry is replaced and re-sorted').toEqual(EXPECTED_PUBLISHED_INDEX);
    expect(decodeBase64Json(contents[4]), 'stale rollup contribution is replaced').toEqual(EXPECTED_PUBLISHED_HISTORY);
    expect(commitBody).toMatchObject([{ message: EXPECTED_COMMIT_MESSAGE }]);
    expect(treePaths).toEqual([EXPECTED_COMMIT_PATHS]);
    expect(calledUrls.filter((url) => EXPECTED_PURGE_URLS.includes(url))).toEqual(EXPECTED_PURGE_URLS);
  });

  it('starts from an empty index and history when neither repository file exists yet', async () => {
    const fetchFn = createPublishFetch(null, null);

    await expect(publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT, fetchFn)).resolves.toEqual({
      commitSha: PUBLISH_SHAS.newCommitSha,
      pdfUrl: EXPECTED_PDF_URL,
    });

    const contents = blobContents(fetchFn);

    expect(contents).toHaveLength(EXPECTED_COMMIT_PATHS.length);
    expect(decodeBase64Json(contents[3])).toEqual(EXPECTED_FIRST_PUBLISH_INDEX);
    expect(decodeBase64Json(contents[4])).toEqual(EXPECTED_FIRST_PUBLISH_HISTORY);
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
    expect(contents, 'all five files are rebuilt and re-uploaded on the retry').toHaveLength(EXPECTED_COMMIT_PATHS.length * 2);
    expect(decodeBase64Json(contents[contents.length - 2]), 'the concurrent index entry is kept').toEqual(EXPECTED_MERGED_INDEX);
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED))),
    );

    await expect(publishEvent(PUBLISH_TOKEN, PUBLISH_INPUT)).rejects.toBeInstanceOf(GithubAuthError);
  });
});
