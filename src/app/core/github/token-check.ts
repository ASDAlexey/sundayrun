import { GITHUB_JSON_ACCEPT, HTTP_FORBIDDEN, HTTP_UNAUTHORIZED, PROTOCOLS_REPO_API_URL } from './github-api.constant';
import { RepoResponse } from './github-api.interface';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { githubHeaders } from './github-request';
import { TokenCheck, TokenCheckType } from './token-check.enum';

/**
 * Probes the protocols repository with the given token. The repository is public, so a bare
 * 200 proves nothing — only `permissions.push` in the body confirms write access: push → valid,
 * OK without push or 401/403 → unauthorized, anything else (including a network failure) → error.
 * Never throws.
 */
export async function checkGithubToken(token: string, fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH): Promise<TokenCheckType> {
  try {
    const response = await fetchFn(PROTOCOLS_REPO_API_URL, { headers: githubHeaders(token, GITHUB_JSON_ACCEPT) });

    if (response.ok) {
      const repo: RepoResponse = await response.json();

      return repo.permissions?.push === true ? TokenCheck.valid : TokenCheck.unauthorized;
    }

    return response.status === HTTP_UNAUTHORIZED || response.status === HTTP_FORBIDDEN ? TokenCheck.unauthorized : TokenCheck.error;
  } catch {
    return TokenCheck.error;
  }
}
