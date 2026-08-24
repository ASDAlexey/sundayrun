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
import {
  type CommitFile,
  type GitBlobResponse,
  type GitCommitResponse,
  type GitRefResponse,
  type GitTreeEntry,
  type GitTreeResponse,
} from './github-api.interface';
import { COMMIT_RETRIES_EXHAUSTED_MESSAGE } from './github-commit.constant';
import { GithubRequestError } from './github-errors';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { type GithubAccess, type GithubFetchFn } from './github-fetch.type';
import { assertAuthorized, assertOk, githubBodyHeaders, githubJson } from './github-request';

/** The files one commit carries, rebuilt from scratch on every attempt against the fresh head sha. */
interface CommitContent {
  readonly buildFiles: (parentSha: string) => Promise<CommitFile[]>;
  readonly message: string;
}

/** One atomic commit: what to write, who writes it, and the transport it goes out on. */
export interface AtomicCommitRequest extends CommitContent {
  readonly token: string;
  readonly fetchFn?: GithubFetchFn;
}

/**
 * Creates ONE commit containing all files produced by `buildFiles` via the Git Data API and
 * fast-forwards the branch: read head ref → build the files against THAT sha → read base commit
 * (tree sha) → upload blobs in parallel (a `base64Content: null` file becomes a `sha: null` tree
 * entry, i.e. a deletion) → create tree → create commit → update ref. Returns the new commit sha.
 * 401/403 anywhere → `GithubAuthError`. A 409/422 on the ref update means the branch moved, so the
 * WHOLE cycle is retried — `buildFiles` is re-invoked on every attempt, so the content is
 * rebuilt against the fresh repository state and a concurrent commit is never overwritten.
 * After `MAX_COMMIT_ATTEMPTS` a `GithubRequestError` with the last ref-update status is thrown.
 * Other non-OK responses throw `GithubRequestError` immediately.
 *
 * The head ref is read BEFORE `buildFiles`, and its sha is handed to it, because the guarantee above
 * needs both halves. Building first and reading the ref afterwards used to leave a window in which a
 * publication landing during the download fast-forwarded without conflict while the tree carried a
 * db assembled from the older bytes — the other event then disappeared with no error at all.
 */
export async function commitFilesAtomically(request: AtomicCommitRequest): Promise<string> {
  const { token, buildFiles, message, fetchFn = DEFAULT_GITHUB_FETCH } = request;
  let lastRefStatus: number = HTTP_CONFLICT;

  for (let attempt = 0; attempt < MAX_COMMIT_ATTEMPTS; attempt += 1) {
    const outcome = await attemptCommit({ token, fetchFn }, { buildFiles, message });

    if (typeof outcome === 'string') {
      return outcome;
    }

    lastRefStatus = outcome;
  }

  throw new GithubRequestError(COMMIT_RETRIES_EXHAUSTED_MESSAGE, lastRefStatus);
}

/** One full commit cycle; returns the new commit sha or the 409/422 status when the ref update was rejected. */
async function attemptCommit(access: GithubAccess, commit: CommitContent): Promise<number | string> {
  const { buildFiles, message } = commit;
  const headSha = (await githubJson<GitRefResponse>(GIT_REF_URL, access)).object.sha;
  const files = await buildFiles(headSha);
  const baseCommit = await githubJson<GitCommitResponse>(`${GIT_COMMITS_URL}/${headSha}`, access);
  const treeEntries = await Promise.all(files.map((file) => createTreeEntry(access, file)));
  const tree = await githubJson<GitTreeResponse>(GIT_TREES_URL, {
    ...access,
    init: postInit({ base_tree: baseCommit.tree.sha, tree: treeEntries }),
  });
  const created = await githubJson<GitCommitResponse>(GIT_COMMITS_URL, {
    ...access,
    init: postInit({ message, tree: tree.sha, parents: [headSha] }),
  });
  const refStatus = await updateRef(access, created.sha);

  return refStatus ?? created.sha;
}

/** Uploads the file as a blob, or emits a `sha: null` entry — the Git tree API deletes that path. */
async function createTreeEntry(access: GithubAccess, file: CommitFile): Promise<GitTreeEntry> {
  const sha = file.base64Content === null ? null : (await createBlob(access, file.base64Content)).sha;

  return { path: file.path, mode: GIT_TREE_FILE_MODE, type: GIT_TREE_BLOB_TYPE, sha };
}

function createBlob(access: GithubAccess, base64Content: string): Promise<GitBlobResponse> {
  return githubJson<GitBlobResponse>(GIT_BLOBS_URL, {
    ...access,
    init: postInit({ content: base64Content, encoding: GIT_BLOB_ENCODING }),
  });
}

/** Fast-forwards the branch ref; returns null on success or the 409/422 status when the update was rejected. */
async function updateRef(access: GithubAccess, commitSha: string): Promise<number | null> {
  const response = await access.fetchFn(GIT_REF_UPDATE_URL, {
    method: PATCH_METHOD,
    headers: githubBodyHeaders(access.token, GITHUB_JSON_ACCEPT),
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
