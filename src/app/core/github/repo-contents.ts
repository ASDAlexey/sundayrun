import {
  CONTENTS_REF_QUERY,
  GITHUB_JSON_ACCEPT,
  GITHUB_RAW_ACCEPT,
  HEAD_METHOD,
  HTTP_NOT_FOUND,
  REPO_CONTENTS_URL,
} from './github-api.constant';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { assertOk, githubHeaders } from './github-request';

/**
 * Reads one repository file as raw text via the Contents API (pinned to the published branch).
 * 404 → null (the file does not exist yet), 401/403 → `GithubAuthError`, other non-OK →
 * `GithubRequestError`.
 */
export async function fetchRepoFileText(
  token: string,
  path: string,
  fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH,
): Promise<string | null> {
  const response = await fetchRepoFile(token, path, fetchFn);

  return response === null ? null : response.text();
}

/** The binary sibling of `fetchRepoFileText` (for `data/sundayrun.db`); the same status mapping. */
export async function fetchRepoFileBytes(
  token: string,
  path: string,
  fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH,
): Promise<Uint8Array | null> {
  const response = await fetchRepoFile(token, path, fetchFn);

  return response === null ? null : new Uint8Array(await response.arrayBuffer());
}

/**
 * Tells whether the path exists on the published branch without downloading it: an authorized HEAD
 * against the same Contents API url. 404 → false, 401/403 → `GithubAuthError`, other non-OK →
 * `GithubRequestError`. Deleting a path through the Git Data API fails when it is not there, so a
 * deletion asks this first.
 */
export async function repoFileExists(token: string, path: string, fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH): Promise<boolean> {
  const url = repoContentsUrl(path);
  const response = await fetchFn(url, { method: HEAD_METHOD, headers: githubHeaders(token, GITHUB_JSON_ACCEPT) });

  if (response.status === HTTP_NOT_FOUND) {
    return false;
  }

  assertOk(response, url);

  return true;
}

async function fetchRepoFile(token: string, path: string, fetchFn: GithubFetchFn): Promise<Response | null> {
  const url = repoContentsUrl(path);
  const response = await fetchFn(url, { headers: githubHeaders(token, GITHUB_RAW_ACCEPT) });

  if (response.status === HTTP_NOT_FOUND) {
    return null;
  }

  assertOk(response, url);

  return response;
}

/** The Contents API url of the path, pinned to the published branch. */
function repoContentsUrl(path: string): string {
  return `${REPO_CONTENTS_URL}${path}${CONTENTS_REF_QUERY}`;
}
