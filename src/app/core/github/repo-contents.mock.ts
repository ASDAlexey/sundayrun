import {
  BEARER_PREFIX,
  CONTENTS_REF_QUERY,
  GITHUB_API_VERSION,
  GITHUB_API_VERSION_HEADER,
  GITHUB_JSON_ACCEPT,
  GITHUB_RAW_ACCEPT,
  HEAD_METHOD,
  REPO_CONTENTS_URL,
} from './github-api.constant';
import { PROTOCOL_DB_PATH, VERSION_JSON_PATH } from './protocols-repo.constant';

export const CONTENTS_TOKEN = 'contents-token';

export const FILE_TEXT = '{"schemaVersion":1,"events":[]}';

export const FILE_BYTES = new Uint8Array([83, 81, 76, 105, 116, 101]);

export const SERVER_ERROR_STATUS = 500;

export const EXPECTED_CONTENTS_URL = `${REPO_CONTENTS_URL}${VERSION_JSON_PATH}${CONTENTS_REF_QUERY}`;

export const EXPECTED_DB_CONTENTS_URL = `${REPO_CONTENTS_URL}${PROTOCOL_DB_PATH}${CONTENTS_REF_QUERY}`;

export const EXPECTED_RAW_INIT = {
  headers: {
    Accept: GITHUB_RAW_ACCEPT,
    Authorization: `${BEARER_PREFIX}${CONTENTS_TOKEN}`,
    [GITHUB_API_VERSION_HEADER]: GITHUB_API_VERSION,
  },
};

/** The existence probe asks for metadata it never reads, so it goes out as a headers-only HEAD. */
export const EXPECTED_HEAD_INIT = {
  method: HEAD_METHOD,
  headers: {
    Accept: GITHUB_JSON_ACCEPT,
    Authorization: `${BEARER_PREFIX}${CONTENTS_TOKEN}`,
    [GITHUB_API_VERSION_HEADER]: GITHUB_API_VERSION,
  },
};
