import { VERSION_COMMIT_MESSAGE_PREFIX } from './version-pointer.constant';
import { GitDataShas } from './spec-utils/git-data-routes';

export const VERSION_POINTER_TOKEN = 'version-pointer-token';

/** Matches the slug published/deleted by the event flow fixtures. */
export const VERSION_POINTER_SLUG = '2026-06-28';

/** The data commit sha the pointer file must reference. */
export const DATA_COMMIT_SHA_MOCK = 'data-commit-sha';

/** Returned by the pointer mini-commit; distinct from the data commit sha the flows must return. */
export const POINTER_COMMIT_SHA_MOCK = 'version-pointer-commit-sha';

export const VERSION_POINTER_SHAS: GitDataShas = {
  headSha: 'version-head-sha',
  baseTreeSha: 'version-base-tree-sha',
  blobShaPrefix: 'version-blob-sha-',
  treeSha: 'version-tree-sha',
  newCommitSha: POINTER_COMMIT_SHA_MOCK,
};

export const EXPECTED_VERSION_COMMIT_MESSAGE = `${VERSION_COMMIT_MESSAGE_PREFIX}${VERSION_POINTER_SLUG}`;

/** The only purge of a publication: the sha-pinned data urls never go stale. */
export const EXPECTED_VERSION_PURGE_URL = 'https://purge.jsdelivr.net/gh/ASDAlexey/sundayrun@main/data/version.json';
