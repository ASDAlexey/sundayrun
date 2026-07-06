export const BRANCH_HEAD_SHA_MOCK = 'branch-head-sha';

/** GET git/ref response subset as served by the GitHub API. */
export const BRANCH_HEAD_RESPONSE_TEXT = JSON.stringify({ object: { sha: BRANCH_HEAD_SHA_MOCK } });

export const BRANCH_HEAD_ERROR_STATUS = 500;
