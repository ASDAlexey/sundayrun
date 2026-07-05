import { CONTENTS_REF_QUERY, HTTP_NOT_FOUND, REPO_CONTENTS_URL } from '../core/github/github-api.constant';
import { GithubFetchFn } from '../core/github/github-fetch.type';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from '../core/github/protocols-repo.constant';
import { PUBLISH_SHAS } from '../core/github/publish-event.mock';
import { createGitDataRoutes } from '../core/github/spec-utils/git-data-routes';
import { routeFetch, statusResponse } from '../core/github/spec-utils/github-fetch-router';

export const STORED_TOKEN_MOCK = 'stored-admin-token';

export const NETWORK_ERROR_MESSAGE = 'network down';

/**
 * Happy-path fetch: an empty repository (404 on both contents reads) plus the Git Data
 * commit routes. Purge urls stay unrouted on purpose — purge failures are swallowed.
 */
export function createPublishSuccessFetch(): GithubFetchFn {
  return routeFetch({
    [`GET ${REPO_CONTENTS_URL}${INDEX_JSON_PATH}${CONTENTS_REF_QUERY}`]: () => statusResponse(HTTP_NOT_FOUND),
    [`GET ${REPO_CONTENTS_URL}${ATHLETES_JSON_PATH}${CONTENTS_REF_QUERY}`]: () => statusResponse(HTTP_NOT_FOUND),
    ...createGitDataRoutes(PUBLISH_SHAS),
  });
}

/** One publish cycle begins with exactly two Contents reads (index.json + athletes.json). */
export const CONTENTS_READS_PER_PUBLISH = 2;
