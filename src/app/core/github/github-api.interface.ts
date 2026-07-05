/** GET /repos/{owner}/{repo} response subset; the repo is public, so only `permissions.push` proves write access. */
export interface RepoResponse {
  permissions?: { push?: boolean };
}

/** GET git/ref response subset. */
export interface GitRefResponse {
  object: { sha: string };
}

/** GET/POST git/commits response subset. */
export interface GitCommitResponse {
  sha: string;
  tree: { sha: string };
}

/** POST git/blobs response subset. */
export interface GitBlobResponse {
  sha: string;
}

/** POST git/trees response subset. */
export interface GitTreeResponse {
  sha: string;
}

/** One file to include into an atomic commit; content is already base64-encoded. */
export interface CommitFile {
  path: string;
  base64Content: string;
}
