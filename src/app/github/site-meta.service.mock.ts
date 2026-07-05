import { Mock, vi } from 'vitest';

import { OK_STATUS } from '../core/github/github-commit.mock';
import { GithubFetchFn } from '../core/github/github-fetch.type';
import { EXPECTED_SITE_META_PURGE_URL, SITE_META_SHAS } from '../core/github/publish-site-meta.mock';
import { createGitDataRoutes } from '../core/github/spec-utils/git-data-routes';
import { routeFetch, statusResponse } from '../core/github/spec-utils/github-fetch-router';

/** jsDelivrFileUrl(SITE_META_JSON_PATH): the branch-pinned CDN url of the site meta. */
export const SITE_META_CDN_URL = 'https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@main/data/site-meta.json';

export const SITE_META_CDN_ERROR_MESSAGE = 'site meta cdn unreachable';

export const SITE_META_SERVER_ERROR_STATUS = 500;

export const SITE_META_NETWORK_ERROR_MESSAGE = 'github unreachable';

export const SITE_META_STORED_TOKEN = 'stored-site-meta-token';

/** Happy-path fetch for one save(): the Git Data cycle plus the CDN purge. */
export function createSiteMetaSaveFetch(): Mock<GithubFetchFn> {
  return vi.fn(
    routeFetch({
      ...createGitDataRoutes(SITE_META_SHAS),
      [`GET ${EXPECTED_SITE_META_PURGE_URL}`]: () => statusResponse(OK_STATUS),
    }),
  );
}
