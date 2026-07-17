import { Mock, vi } from 'vitest';

import { DELETE_SHAS } from '../core/github/delete-event.mock';
import { OK_STATUS } from '../core/github/github-commit.mock';
import { GithubFetchFn } from '../core/github/github-fetch.type';
import { CURRENT_DB_BYTES, DB_CONTENTS_KEY } from '../core/github/protocol-db-file.mock';
import { createGitDataRoutes } from '../core/github/spec-utils/git-data-routes';
import { RouteHandler, routeFetch, statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { EXPECTED_VERSION_PURGE_URL } from '../core/github/version-pointer.mock';

export const EVENT_DELETE_STORED_TOKEN = 'stored-delete-token';

export const EVENT_DELETE_NETWORK_ERROR_MESSAGE = 'github unreachable';

/** Happy-path fetch for one delete(): the db download, the Git Data cycles and the pointer purge. */
export function createEventDeleteFetch(overrides: Record<string, RouteHandler> = {}): Mock<GithubFetchFn> {
  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(DELETE_SHAS),
      [`GET ${EXPECTED_VERSION_PURGE_URL}`]: () => statusResponse(OK_STATUS),
      [DB_CONTENTS_KEY]: () => new Response(CURRENT_DB_BYTES),
      ...overrides,
    }),
  );
}
