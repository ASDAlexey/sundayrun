import {
  BEARER_PREFIX,
  CONTENTS_REF_QUERY,
  GITHUB_API_VERSION,
  GITHUB_API_VERSION_HEADER,
  GITHUB_RAW_ACCEPT,
  REPO_CONTENTS_URL,
} from '../core/github/github-api.constant';
import { ATHLETES_JSON_PATH } from '../core/github/protocols-repo.constant';
import { ADMIN_TOKEN_MOCK } from './admin-token.service.mock';

/** The Contents API url `loadHistory` must hit for `athletes.json`. */
export const EXPECTED_ATHLETES_URL = `${REPO_CONTENTS_URL}${ATHLETES_JSON_PATH}${CONTENTS_REF_QUERY}`;

/** Raw-accept init carrying the stored organiser token. */
export const EXPECTED_HISTORY_INIT = {
  headers: {
    Accept: GITHUB_RAW_ACCEPT,
    Authorization: `${BEARER_PREFIX}${ADMIN_TOKEN_MOCK}`,
    [GITHUB_API_VERSION_HEADER]: GITHUB_API_VERSION,
  },
};
