import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from './github-api.constant';
import { GithubAuthError, GithubRequestError } from './github-errors';
import { INDEX_JSON_PATH } from './protocols-repo.constant';
import { fetchRepoFileText } from './repo-contents';
import { CONTENTS_TOKEN, EXPECTED_CONTENTS_URL, EXPECTED_RAW_INIT, FILE_TEXT, SERVER_ERROR_STATUS } from './repo-contents.mock';
import { statusResponse } from './spec-utils/github-fetch-router';

describe('fetchRepoFileText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the raw file pinned to the branch and returns its text', async () => {
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response(FILE_TEXT)));

    await expect(fetchRepoFileText(CONTENTS_TOKEN, INDEX_JSON_PATH, fetchFn)).resolves.toBe(FILE_TEXT);
    expect(fetchFn).toHaveBeenCalledWith(EXPECTED_CONTENTS_URL, EXPECTED_RAW_INIT);
  });

  it('maps 404 to null, 401/403 to GithubAuthError and other non-OK to GithubRequestError', async () => {
    const missing = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_NOT_FOUND)));
    const forbidden = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_FORBIDDEN)));
    const failing = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(SERVER_ERROR_STATUS)));

    await expect(fetchRepoFileText(CONTENTS_TOKEN, INDEX_JSON_PATH, missing)).resolves.toBeNull();
    await expect(fetchRepoFileText(CONTENTS_TOKEN, INDEX_JSON_PATH, forbidden)).rejects.toBeInstanceOf(GithubAuthError);
    await expect(fetchRepoFileText(CONTENTS_TOKEN, INDEX_JSON_PATH, failing)).rejects.toBeInstanceOf(GithubRequestError);
    await expect(fetchRepoFileText(CONTENTS_TOKEN, INDEX_JSON_PATH, failing)).rejects.toMatchObject({ status: SERVER_ERROR_STATUS });
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_NOT_FOUND))),
    );

    await expect(fetchRepoFileText(CONTENTS_TOKEN, INDEX_JSON_PATH)).resolves.toBeNull();
  });
});
