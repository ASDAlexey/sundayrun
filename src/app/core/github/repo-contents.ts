import { CONTENTS_REF_QUERY, GITHUB_RAW_ACCEPT, HTTP_NOT_FOUND, REPO_CONTENTS_URL } from './github-api.constant';
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
  const url = `${REPO_CONTENTS_URL}${path}${CONTENTS_REF_QUERY}`;
  const response = await fetchFn(url, { headers: githubHeaders(token, GITHUB_RAW_ACCEPT) });

  if (response.status === HTTP_NOT_FOUND) {
    return null;
  }

  assertOk(response, url);

  return response.text();
}
