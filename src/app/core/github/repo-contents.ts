import {
  CONTENTS_REF_QUERY_PREFIX,
  GITHUB_JSON_ACCEPT,
  GITHUB_RAW_ACCEPT,
  HEAD_METHOD,
  HTTP_NOT_FOUND,
  REPO_CONTENTS_URL,
} from './github-api.constant';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { type GithubFetchFn } from './github-fetch.type';
import { assertOk, githubHeaders } from './github-request';
import { PROTOCOLS_REPO_BRANCH } from './protocols-repo.constant';

/** Everything a Contents API read needs besides the path itself: auth and the transport to use. */
export interface RepoFileRequest {
  readonly token: string;
  readonly fetchFn?: GithubFetchFn;
}

/** A read that may be pinned to one commit instead of the published branch. */
export interface PinnedRepoFileRequest extends RepoFileRequest {
  readonly ref?: string;
}

/**
 * Reads one repository file as raw text via the Contents API (pinned to the published branch).
 * 404 → null (the file does not exist yet), 401/403 → `GithubAuthError`, other non-OK →
 * `GithubRequestError`.
 */
export async function fetchRepoFileText(path: string, request: RepoFileRequest): Promise<string | null> {
  const response = await fetchRepoFile(path, request);

  return response === null ? null : response.text();
}

/**
 * The binary sibling of `fetchRepoFileText` (for `data/sundayrun.db`); the same status mapping.
 *
 * `ref` pins the read to one commit. A publication passes the sha its own commit will hang off, so
 * the bytes it rebuilds cannot be a snapshot of some other state than the parent it declares.
 */
export async function fetchRepoFileBytes(path: string, request: PinnedRepoFileRequest): Promise<Uint8Array | null> {
  const response = await fetchRepoFile(path, request);

  return response === null ? null : new Uint8Array(await response.arrayBuffer());
}

/**
 * Tells whether the path exists on the published branch without downloading it: an authorized HEAD
 * against the same Contents API url. 404 → false, 401/403 → `GithubAuthError`, other non-OK →
 * `GithubRequestError`. Deleting a path through the Git Data API fails when it is not there, so a
 * deletion asks this first.
 */
export async function repoFileExists(path: string, request: RepoFileRequest): Promise<boolean> {
  const { token, fetchFn = DEFAULT_GITHUB_FETCH } = request;
  const url = repoContentsUrl(path);
  const response = await fetchFn(url, { method: HEAD_METHOD, headers: githubHeaders(token, GITHUB_JSON_ACCEPT) });

  if (response.status === HTTP_NOT_FOUND) {
    return false;
  }

  assertOk(response, url);

  return true;
}

async function fetchRepoFile(path: string, request: PinnedRepoFileRequest): Promise<Response | null> {
  const { token, fetchFn = DEFAULT_GITHUB_FETCH, ref = PROTOCOLS_REPO_BRANCH } = request;
  const url = repoContentsUrl(path, ref);
  const response = await fetchFn(url, { headers: githubHeaders(token, GITHUB_RAW_ACCEPT) });

  if (response.status === HTTP_NOT_FOUND) {
    return null;
  }

  assertOk(response, url);

  return response;
}

/** The Contents API url of the path, pinned to the published branch unless a commit sha is given. */
function repoContentsUrl(path: string, ref: string = PROTOCOLS_REPO_BRANCH): string {
  return `${REPO_CONTENTS_URL}${path}${CONTENTS_REF_QUERY_PREFIX}${ref}`;
}
