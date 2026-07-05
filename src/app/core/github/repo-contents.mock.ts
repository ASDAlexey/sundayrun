import {
  BEARER_PREFIX,
  CONTENTS_REF_QUERY,
  GITHUB_API_VERSION,
  GITHUB_API_VERSION_HEADER,
  GITHUB_RAW_ACCEPT,
  REPO_CONTENTS_URL,
} from './github-api.constant';
import { INDEX_JSON_PATH } from './protocols-repo.constant';

export const CONTENTS_TOKEN = 'contents-token';

export const FILE_TEXT = '{"schemaVersion":1,"events":[]}';

export const SERVER_ERROR_STATUS = 500;

export const EXPECTED_CONTENTS_URL = `${REPO_CONTENTS_URL}${INDEX_JSON_PATH}${CONTENTS_REF_QUERY}`;

export const EXPECTED_RAW_INIT = {
  headers: {
    Accept: GITHUB_RAW_ACCEPT,
    Authorization: `${BEARER_PREFIX}${CONTENTS_TOKEN}`,
    [GITHUB_API_VERSION_HEADER]: GITHUB_API_VERSION,
  },
};
