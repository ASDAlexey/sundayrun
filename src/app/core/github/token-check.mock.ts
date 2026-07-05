import { BEARER_PREFIX, GITHUB_API_VERSION, GITHUB_API_VERSION_HEADER, GITHUB_JSON_ACCEPT } from './github-api.constant';
import { RepoResponse } from './github-api.interface';

export const CHECKED_TOKEN = 'checked-token';

export const SERVER_ERROR_STATUS = 500;

/** The token can write to the repository. */
export const PUSH_REPO_RESPONSE: RepoResponse = { permissions: { push: true } };

/** A valid PAT without write access still sees the public repository. */
export const READ_ONLY_REPO_RESPONSE: RepoResponse = { permissions: { push: false } };

/** No `permissions` field at all must also be treated as unauthorized. */
export const NO_PERMISSIONS_REPO_RESPONSE: RepoResponse = {};

export const EXPECTED_CHECK_INIT = {
  headers: {
    Accept: GITHUB_JSON_ACCEPT,
    Authorization: `${BEARER_PREFIX}${CHECKED_TOKEN}`,
    [GITHUB_API_VERSION_HEADER]: GITHUB_API_VERSION,
  },
};
