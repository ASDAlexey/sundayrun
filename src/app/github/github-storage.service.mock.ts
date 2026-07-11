import { HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { GithubFetchFn } from '../core/github/github-fetch.type';
import { DB_CONTENTS_KEY } from '../core/github/protocol-db-file.mock';
import { PUBLISH_SHAS } from '../core/github/publish-event.mock';
import { createGitDataRoutes } from '../core/github/spec-utils/git-data-routes';
import { routeFetch, statusResponse } from '../core/github/spec-utils/github-fetch-router';

export const STORED_TOKEN_MOCK = 'stored-admin-token';

export const NETWORK_ERROR_MESSAGE = 'network down';

/**
 * Happy-path fetch: an empty repository (404 on the db read, so a fresh db is built) plus the Git
 * Data commit routes. Purge urls stay unrouted on purpose — purge failures are swallowed.
 */
export function createPublishSuccessFetch(): GithubFetchFn {
  return routeFetch({
    [DB_CONTENTS_KEY]: () => statusResponse(HTTP_NOT_FOUND),
    ...createGitDataRoutes(PUBLISH_SHAS),
  });
}

/** One publish cycle begins with a single Contents read: the db download. */
export const CONTENTS_READS_PER_PUBLISH = 1;
