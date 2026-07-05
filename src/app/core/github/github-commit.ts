import {
  GIT_BLOBS_URL,
  GIT_BLOB_ENCODING,
  GIT_COMMITS_URL,
  GIT_REF_UPDATE_URL,
  GIT_REF_URL,
  GIT_TREES_URL,
  GIT_TREE_BLOB_TYPE,
  GIT_TREE_FILE_MODE,
  GITHUB_JSON_ACCEPT,
  HTTP_CONFLICT,
  HTTP_UNPROCESSABLE,
  MAX_COMMIT_ATTEMPTS,
  PATCH_METHOD,
  POST_METHOD,
} from './github-api.constant';
import { CommitFile, GitBlobResponse, GitCommitResponse, GitRefResponse, GitTreeResponse } from './github-api.interface';
import { COMMIT_RETRIES_EXHAUSTED_MESSAGE } from './github-commit.constant';
import { GithubRequestError } from './github-errors';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { assertAuthorized, assertOk, githubBodyHeaders, githubJson } from './github-request';

/**
 * Creates ONE commit containing all files produced by `buildFiles` via the Git Data API and
 * fast-forwards the branch: read head ref → read base commit (tree sha) → upload blobs in
 * parallel → create tree → create commit → update ref. Returns the new commit sha. 401/403
 * anywhere → `GithubAuthError`. A 409/422 on the ref update means the branch moved, so the
 * WHOLE cycle is retried — `buildFiles` is re-invoked on every attempt, so the content is
 * rebuilt against the fresh repository state and a concurrent commit is never overwritten.
 * After `MAX_COMMIT_ATTEMPTS` a `GithubRequestError` with the last ref-update status is thrown.
 * Other non-OK responses throw `GithubRequestError` immediately.
 */
export async function commitFilesAtomically(
  token: string,
  buildFiles: () => Promise<CommitFile[]>,
  message: string,
  fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH,
): Promise<string> {
  let lastRefStatus: number = HTTP_CONFLICT;

  for (let attempt = 0; attempt < MAX_COMMIT_ATTEMPTS; attempt += 1) {
    const outcome = await attemptCommit(fetchFn, token, await buildFiles(), message);

    if (typeof outcome === 'string') {
      return outcome;
    }

    lastRefStatus = outcome;
  }

  throw new GithubRequestError(COMMIT_RETRIES_EXHAUSTED_MESSAGE, lastRefStatus);
}

/** One full commit cycle; returns the new commit sha or the 409/422 status when the ref update was rejected. */
async function attemptCommit(fetchFn: GithubFetchFn, token: string, files: CommitFile[], message: string): Promise<number | string> {
  const headSha = (await githubJson<GitRefResponse>(fetchFn, token, GIT_REF_URL)).object.sha;
  const baseCommit = await githubJson<GitCommitResponse>(fetchFn, token, `${GIT_COMMITS_URL}/${headSha}`);
  const blobs = await Promise.all(files.map((file) => createBlob(fetchFn, token, file)));
  const tree = await githubJson<GitTreeResponse>(
    fetchFn,
    token,
    GIT_TREES_URL,
    postInit({
      base_tree: baseCommit.tree.sha,
      tree: files.map((file, index) => ({
        path: file.path,
        mode: GIT_TREE_FILE_MODE,
        type: GIT_TREE_BLOB_TYPE,
        sha: blobs[index].sha,
      })),
    }),
  );
  const commit = await githubJson<GitCommitResponse>(
    fetchFn,
    token,
    GIT_COMMITS_URL,
    postInit({ message, tree: tree.sha, parents: [headSha] }),
  );
  const refStatus = await updateRef(fetchFn, token, commit.sha);

  return refStatus ?? commit.sha;
}

function createBlob(fetchFn: GithubFetchFn, token: string, file: CommitFile): Promise<GitBlobResponse> {
  return githubJson<GitBlobResponse>(fetchFn, token, GIT_BLOBS_URL, postInit({ content: file.base64Content, encoding: GIT_BLOB_ENCODING }));
}

/** Fast-forwards the branch ref; returns null on success or the 409/422 status when the update was rejected. */
async function updateRef(fetchFn: GithubFetchFn, token: string, commitSha: string): Promise<number | null> {
  const response = await fetchFn(GIT_REF_UPDATE_URL, {
    method: PATCH_METHOD,
    headers: githubBodyHeaders(token, GITHUB_JSON_ACCEPT),
    body: JSON.stringify({ sha: commitSha }),
  });

  assertAuthorized(response, GIT_REF_UPDATE_URL);

  if (response.status === HTTP_CONFLICT || response.status === HTTP_UNPROCESSABLE) {
    return response.status;
  }

  assertOk(response, GIT_REF_UPDATE_URL);

  return null;
}

function postInit(body: unknown): RequestInit {
  return { method: POST_METHOD, body: JSON.stringify(body) };
}
