import { Mock, vi } from 'vitest';

import { STALE_INDEX } from '../core/github/archive-index.mock';
import { DELETE_SHAS } from '../core/github/delete-event.mock';
import { CONTENTS_REF_QUERY, REPO_CONTENTS_URL } from '../core/github/github-api.constant';
import { OK_STATUS } from '../core/github/github-commit.mock';
import { GithubFetchFn } from '../core/github/github-fetch.type';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from '../core/github/protocols-repo.constant';
import { EXISTING_HISTORY_TEXT, EXPECTED_PURGE_URLS } from '../core/github/publish-event.mock';
import { createGitDataRoutes } from '../core/github/spec-utils/git-data-routes';
import { RouteHandler, routeFetch, statusResponse } from '../core/github/spec-utils/github-fetch-router';

export const EVENT_DELETE_STORED_TOKEN = 'stored-delete-token';

export const EVENT_DELETE_NETWORK_ERROR_MESSAGE = 'github unreachable';

/** Happy-path fetch for one delete(): the summary reads, the Git Data cycle and the CDN purges. */
export function createEventDeleteFetch(): Mock<GithubFetchFn> {
  const okPurgeRoutes = Object.fromEntries(
    EXPECTED_PURGE_URLS.map((url): [string, RouteHandler] => [`GET ${url}`, () => statusResponse(OK_STATUS)]),
  );

  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(DELETE_SHAS),
      ...okPurgeRoutes,
      [`GET ${REPO_CONTENTS_URL}${INDEX_JSON_PATH}${CONTENTS_REF_QUERY}`]: () => new Response(JSON.stringify(STALE_INDEX)),
      [`GET ${REPO_CONTENTS_URL}${ATHLETES_JSON_PATH}${CONTENTS_REF_QUERY}`]: () => new Response(EXISTING_HISTORY_TEXT),
    }),
  );
}
