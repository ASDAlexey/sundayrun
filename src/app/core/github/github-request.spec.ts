import { GITHUB_JSON_ACCEPT, HTTP_FORBIDDEN, HTTP_UNAUTHORIZED, POST_METHOD } from './github-api.constant';
import { GithubAuthError, GithubRequestError } from './github-errors';
import { assertOk, githubBodyHeaders, githubHeaders, githubJson } from './github-request';
import {
  EXPECTED_BODY_HEADERS,
  EXPECTED_JSON_HEADERS,
  EXPECTED_JSON_INIT,
  OK_JSON_BODY,
  REQUEST_BODY,
  SERVER_ERROR_STATUS,
  TEST_TOKEN,
  TEST_URL,
} from './github-request.mock';
import { jsonResponse, statusResponse } from './spec-utils/github-fetch-router';

describe('githubHeaders', () => {
  it('builds the accept, bearer and api-version headers, adding Content-Type for body requests', () => {
    expect(githubHeaders(TEST_TOKEN, GITHUB_JSON_ACCEPT)).toEqual(EXPECTED_JSON_HEADERS);
    expect(githubBodyHeaders(TEST_TOKEN, GITHUB_JSON_ACCEPT)).toEqual(EXPECTED_BODY_HEADERS);
  });
});

describe('assertOk', () => {
  it('passes OK, maps 401/403 to GithubAuthError and other non-OK to GithubRequestError with status', () => {
    let requestError: unknown = null;

    try {
      assertOk(statusResponse(SERVER_ERROR_STATUS), TEST_URL);
    } catch (error) {
      requestError = error;
    }

    expect(() => assertOk(jsonResponse(OK_JSON_BODY), TEST_URL)).not.toThrow();
    expect(() => assertOk(statusResponse(HTTP_UNAUTHORIZED), TEST_URL)).toThrow(GithubAuthError);
    expect(() => assertOk(statusResponse(HTTP_FORBIDDEN), TEST_URL)).toThrow(GithubAuthError);
    expect(requestError).toBeInstanceOf(GithubRequestError);
    expect(requestError).toMatchObject({ status: SERVER_ERROR_STATUS });
  });
});

describe('githubJson', () => {
  it('sends the merged init with GitHub headers and returns the parsed body', async () => {
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(jsonResponse(OK_JSON_BODY)));

    const result = await githubJson(fetchFn, TEST_TOKEN, TEST_URL, { method: POST_METHOD, body: REQUEST_BODY });

    expect(result).toEqual(OK_JSON_BODY);
    expect(fetchFn).toHaveBeenCalledWith(TEST_URL, EXPECTED_JSON_INIT);
  });

  it('rejects with GithubAuthError on an unauthorized response', async () => {
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(statusResponse(HTTP_UNAUTHORIZED)));

    await expect(githubJson(fetchFn, TEST_TOKEN, TEST_URL)).rejects.toBeInstanceOf(GithubAuthError);
  });
});
