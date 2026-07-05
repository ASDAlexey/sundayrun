import { GIT_BLOBS_URL, GIT_COMMITS_URL, GIT_REF_UPDATE_URL, GIT_REF_URL, GIT_TREES_URL } from '../github-api.constant';
import { RouteHandler, jsonResponse } from './github-fetch-router';

export interface GitDataShas {
  headSha: string;
  baseTreeSha: string;
  blobShaPrefix: string;
  treeSha: string;
  newCommitSha: string;
}

/** Happy-path Git Data API routes; blob shas are `<blobShaPrefix><zero-based call index>`. */
export function createGitDataRoutes(shas: GitDataShas): Record<string, RouteHandler> {
  let blobIndex = 0;

  return {
    [`GET ${GIT_REF_URL}`]: () => jsonResponse({ object: { sha: shas.headSha } }),
    [`GET ${GIT_COMMITS_URL}/${shas.headSha}`]: () => jsonResponse({ sha: shas.headSha, tree: { sha: shas.baseTreeSha } }),
    [`POST ${GIT_BLOBS_URL}`]: () => jsonResponse({ sha: `${shas.blobShaPrefix}${blobIndex++}` }),
    [`POST ${GIT_TREES_URL}`]: () => jsonResponse({ sha: shas.treeSha }),
    [`POST ${GIT_COMMITS_URL}`]: () => jsonResponse({ sha: shas.newCommitSha, tree: { sha: shas.treeSha } }),
    [`PATCH ${GIT_REF_UPDATE_URL}`]: () => jsonResponse({ object: { sha: shas.newCommitSha } }),
  };
}
