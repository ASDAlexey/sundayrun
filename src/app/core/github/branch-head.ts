import { GIT_REF_URL, GITHUB_JSON_ACCEPT } from './github-api.constant';
import { GitRefResponse } from './github-api.interface';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { assertOk } from './github-request';

/**
 * Anonymous read of the published branch head sha via the public Git refs API. Unlike the CDN
 * the API is never cached, so the returned sha always reflects the latest publication; the
 * unauthenticated rate limit (60/hour per client IP) comfortably covers one read per visit.
 */
export async function fetchBranchHeadSha(fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH): Promise<string> {
  const response = await fetchFn(GIT_REF_URL, { headers: { Accept: GITHUB_JSON_ACCEPT } });

  assertOk(response, GIT_REF_URL);

  const payload: GitRefResponse = await response.json();

  return payload.object.sha;
}
