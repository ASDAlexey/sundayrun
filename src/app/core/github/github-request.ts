import {
  BEARER_PREFIX,
  CONTENT_TYPE_HEADER,
  GITHUB_API_VERSION,
  GITHUB_API_VERSION_HEADER,
  GITHUB_JSON_ACCEPT,
  HTTP_FORBIDDEN,
  HTTP_UNAUTHORIZED,
  JSON_CONTENT_TYPE,
} from './github-api.constant';
import { GithubAuthError, GithubRequestError } from './github-errors';
import { GithubFetchFn } from './github-fetch.type';
import { GITHUB_AUTH_ERROR_PREFIX, GITHUB_REQUEST_ERROR_PREFIX } from './github-request.constant';

/** Standard GitHub REST headers for the given accept type. */
export function githubHeaders(token: string, accept: string): Record<string, string> {
  return {
    Accept: accept,
    Authorization: `${BEARER_PREFIX}${token}`,
    [GITHUB_API_VERSION_HEADER]: GITHUB_API_VERSION,
  };
}

/** Headers for a request carrying a JSON body: the standard GitHub headers plus Content-Type. */
export function githubBodyHeaders(token: string, accept: string): Record<string, string> {
  return { ...githubHeaders(token, accept), [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE };
}

/** Throws `GithubAuthError` when the response is 401/403. */
export function assertAuthorized(response: Response, url: string): void {
  if (response.status === HTTP_UNAUTHORIZED || response.status === HTTP_FORBIDDEN) {
    throw new GithubAuthError(`${GITHUB_AUTH_ERROR_PREFIX}${url}`);
  }
}

/** Throws `GithubAuthError` on 401/403 and `GithubRequestError` on any other non-OK response. */
export function assertOk(response: Response, url: string): void {
  assertAuthorized(response, url);

  if (!response.ok) {
    throw new GithubRequestError(`${GITHUB_REQUEST_ERROR_PREFIX}${url}`, response.status);
  }
}

/** Performs a JSON request against the GitHub API (auth checked) and returns the parsed body. */
export async function githubJson<T>(fetchFn: GithubFetchFn, token: string, url: string, init?: RequestInit): Promise<T> {
  const headers = init?.body === undefined ? githubHeaders(token, GITHUB_JSON_ACCEPT) : githubBodyHeaders(token, GITHUB_JSON_ACCEPT);
  const response = await fetchFn(url, { ...init, headers });

  assertOk(response, url);

  return response.json();
}
