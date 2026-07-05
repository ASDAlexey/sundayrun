import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { JSDELIVR_CDN_BASE_URL, JSDELIVR_PURGE_BASE_URL, JSDELIVR_REF_SEPARATOR } from './jsdelivr.constant';
import { PROTOCOLS_REPO_BRANCH, PROTOCOLS_REPO_NAME, PROTOCOLS_REPO_OWNER } from './protocols-repo.constant';

/** Public CDN url of a repository file; pass a commit sha as `ref` for an immutable link. */
export function jsDelivrFileUrl(path: string, ref: string = PROTOCOLS_REPO_BRANCH): string {
  return `${JSDELIVR_CDN_BASE_URL}${jsDelivrRepoPath(ref, path)}`;
}

/** Best-effort cache purge of the branch urls; every failure (reject or non-OK) is swallowed. */
export async function purgeJsDelivrPaths(paths: string[], fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH): Promise<void> {
  await Promise.all(paths.map((path) => purgePath(fetchFn, path)));
}

function purgePath(fetchFn: GithubFetchFn, path: string): Promise<unknown> {
  return fetchFn(`${JSDELIVR_PURGE_BASE_URL}${jsDelivrRepoPath(PROTOCOLS_REPO_BRANCH, path)}`).catch(() => undefined);
}

function jsDelivrRepoPath(ref: string, path: string): string {
  return `${PROTOCOLS_REPO_OWNER}/${PROTOCOLS_REPO_NAME}${JSDELIVR_REF_SEPARATOR}${ref}/${path}`;
}
