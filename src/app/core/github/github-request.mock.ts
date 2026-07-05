import {
  BEARER_PREFIX,
  CONTENT_TYPE_HEADER,
  GITHUB_API_VERSION,
  GITHUB_API_VERSION_HEADER,
  GITHUB_JSON_ACCEPT,
  JSON_CONTENT_TYPE,
  POST_METHOD,
} from './github-api.constant';

export const TEST_TOKEN = 'test-token';

export const TEST_URL = 'https://api.github.com/repos/test/test';

export const OK_JSON_BODY = { sha: 'abc123' };

export const REQUEST_BODY = '{"content":"payload"}';

export const SERVER_ERROR_STATUS = 500;

export const EXPECTED_JSON_HEADERS = {
  Accept: GITHUB_JSON_ACCEPT,
  Authorization: `${BEARER_PREFIX}${TEST_TOKEN}`,
  [GITHUB_API_VERSION_HEADER]: GITHUB_API_VERSION,
};

/** Requests with a JSON body also declare the Content-Type. */
export const EXPECTED_BODY_HEADERS = { ...EXPECTED_JSON_HEADERS, [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE };

export const EXPECTED_JSON_INIT = { method: POST_METHOD, body: REQUEST_BODY, headers: EXPECTED_BODY_HEADERS };
