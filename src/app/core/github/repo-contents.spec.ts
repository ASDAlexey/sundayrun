import { HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from './github-api.constant';
import { OK_STATUS } from './github-commit.mock';
import { GithubAuthError, GithubRequestError } from './github-errors';
import { VERSION_JSON_PATH, PROTOCOL_DB_PATH } from './protocols-repo.constant';
import { fetchRepoFileBytes, fetchRepoFileText, repoFileExists } from './repo-contents';
import {
  CONTENTS_TOKEN,
  EXPECTED_CONTENTS_URL,
  EXPECTED_DB_CONTENTS_URL,
  EXPECTED_HEAD_INIT,
  EXPECTED_RAW_INIT,
  FILE_BYTES,
  FILE_TEXT,
  SERVER_ERROR_STATUS,
} from './repo-contents.mock';
import { statusResponse } from './spec-utils/github-fetch-router';

describe('fetchRepoFileText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the raw file pinned to the branch and returns its text', async () => {
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response(FILE_TEXT)));

    await expect(fetchRepoFileText(CONTENTS_TOKEN, VERSION_JSON_PATH, fetchFn)).resolves.toBe(FILE_TEXT);
    expect(fetchFn).toHaveBeenCalledWith(EXPECTED_CONTENTS_URL, EXPECTED_RAW_INIT);
  });

  it('maps 404 to null, 401/403 to GithubAuthError and other non-OK to GithubRequestError', async () => {
    const missing = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_NOT_FOUND)));
    const forbidden = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_FORBIDDEN)));
    const failing = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(SERVER_ERROR_STATUS)));

    await expect(fetchRepoFileText(CONTENTS_TOKEN, VERSION_JSON_PATH, missing)).resolves.toBeNull();
    await expect(fetchRepoFileText(CONTENTS_TOKEN, VERSION_JSON_PATH, forbidden)).rejects.toBeInstanceOf(GithubAuthError);
    await expect(fetchRepoFileText(CONTENTS_TOKEN, VERSION_JSON_PATH, failing)).rejects.toBeInstanceOf(GithubRequestError);
    await expect(fetchRepoFileText(CONTENTS_TOKEN, VERSION_JSON_PATH, failing)).rejects.toMatchObject({ status: SERVER_ERROR_STATUS });
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_NOT_FOUND))),
    );

    await expect(fetchRepoFileText(CONTENTS_TOKEN, VERSION_JSON_PATH)).resolves.toBeNull();
  });
});

describe('repoFileExists', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('probes the branch-pinned path with an authorized HEAD and maps the statuses', async () => {
    const present = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(OK_STATUS)));
    const missing = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_NOT_FOUND)));
    const unauthorized = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED)));
    const failing = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(SERVER_ERROR_STATUS)));

    await expect(repoFileExists(CONTENTS_TOKEN, VERSION_JSON_PATH, present)).resolves.toBe(true);
    expect(present, 'the same contents url as a read, but nothing is downloaded').toHaveBeenCalledWith(
      EXPECTED_CONTENTS_URL,
      EXPECTED_HEAD_INIT,
    );
    await expect(repoFileExists(CONTENTS_TOKEN, VERSION_JSON_PATH, missing)).resolves.toBe(false);
    await expect(repoFileExists(CONTENTS_TOKEN, VERSION_JSON_PATH, unauthorized)).rejects.toBeInstanceOf(GithubAuthError);
    await expect(repoFileExists(CONTENTS_TOKEN, VERSION_JSON_PATH, failing)).rejects.toBeInstanceOf(GithubRequestError);
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_NOT_FOUND))),
    );

    await expect(repoFileExists(CONTENTS_TOKEN, VERSION_JSON_PATH)).resolves.toBe(false);
  });
});

describe('fetchRepoFileBytes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the raw file pinned to the branch, returns its bytes and maps 404 to null', async () => {
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response(FILE_BYTES)));
    const missing = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_NOT_FOUND)));

    await expect(fetchRepoFileBytes(CONTENTS_TOKEN, PROTOCOL_DB_PATH, fetchFn)).resolves.toEqual(FILE_BYTES);
    expect(fetchFn).toHaveBeenCalledWith(EXPECTED_DB_CONTENTS_URL, EXPECTED_RAW_INIT);
    await expect(fetchRepoFileBytes(CONTENTS_TOKEN, PROTOCOL_DB_PATH, missing)).resolves.toBeNull();
  });

  it('falls back to the global fetch by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(statusResponse(HTTP_NOT_FOUND))),
    );

    await expect(fetchRepoFileBytes(CONTENTS_TOKEN, PROTOCOL_DB_PATH)).resolves.toBeNull();
  });
});
