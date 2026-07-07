import { Mock, vi } from 'vitest';

import { STALE_INDEX } from '../core/github/archive-index.mock';
import { DELETE_SHAS } from '../core/github/delete-event.mock';
import { CONTENTS_REF_QUERY, REPO_CONTENTS_URL } from '../core/github/github-api.constant';
import { OK_STATUS } from '../core/github/github-commit.mock';
import { GithubFetchFn } from '../core/github/github-fetch.type';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from '../core/github/protocols-repo.constant';
import { EXISTING_HISTORY_TEXT } from '../core/github/publish-event.mock';
import { createGitDataRoutes } from '../core/github/spec-utils/git-data-routes';
import { routeFetch, statusResponse } from '../core/github/spec-utils/github-fetch-router';
import { EXPECTED_VERSION_PURGE_URL } from '../core/github/version-pointer.mock';

export const EVENT_DELETE_STORED_TOKEN = 'stored-delete-token';

export const EVENT_DELETE_NETWORK_ERROR_MESSAGE = 'github unreachable';

/** Happy-path fetch for one delete(): the summary reads, the Git Data cycles and the pointer purge. */
export function createEventDeleteFetch(): Mock<GithubFetchFn> {
  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(DELETE_SHAS),
      [`GET ${EXPECTED_VERSION_PURGE_URL}`]: () => statusResponse(OK_STATUS),
      [`GET ${REPO_CONTENTS_URL}${INDEX_JSON_PATH}${CONTENTS_REF_QUERY}`]: () => new Response(JSON.stringify(STALE_INDEX)),
      [`GET ${REPO_CONTENTS_URL}${ATHLETES_JSON_PATH}${CONTENTS_REF_QUERY}`]: () => new Response(EXISTING_HISTORY_TEXT),
    }),
  );
}
