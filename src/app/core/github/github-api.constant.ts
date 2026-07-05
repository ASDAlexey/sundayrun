import { PROTOCOLS_REPO_BRANCH, PROTOCOLS_REPO_NAME, PROTOCOLS_REPO_OWNER } from './protocols-repo.constant';

export const GITHUB_API_BASE_URL = 'https://api.github.com';

/** REST base of the protocols repository. */
export const PROTOCOLS_REPO_API_URL = `${GITHUB_API_BASE_URL}/repos/${PROTOCOLS_REPO_OWNER}/${PROTOCOLS_REPO_NAME}`;

/** Read the current head of the published branch. */
export const GIT_REF_URL = `${PROTOCOLS_REPO_API_URL}/git/ref/heads/${PROTOCOLS_REPO_BRANCH}`;

/** Fast-forward the published branch (PATCH). */
export const GIT_REF_UPDATE_URL = `${PROTOCOLS_REPO_API_URL}/git/refs/heads/${PROTOCOLS_REPO_BRANCH}`;

export const GIT_BLOBS_URL = `${PROTOCOLS_REPO_API_URL}/git/blobs`;

export const GIT_TREES_URL = `${PROTOCOLS_REPO_API_URL}/git/trees`;

export const GIT_COMMITS_URL = `${PROTOCOLS_REPO_API_URL}/git/commits`;

/** Contents API base; append the file path and `CONTENTS_REF_QUERY`. */
export const REPO_CONTENTS_URL = `${PROTOCOLS_REPO_API_URL}/contents/`;

export const CONTENTS_REF_QUERY = `?ref=${PROTOCOLS_REPO_BRANCH}`;

export const GITHUB_JSON_ACCEPT = 'application/vnd.github+json';

export const GITHUB_RAW_ACCEPT = 'application/vnd.github.raw+json';

export const GITHUB_API_VERSION_HEADER = 'X-GitHub-Api-Version';

export const GITHUB_API_VERSION = '2022-11-28';

export const CONTENT_TYPE_HEADER = 'Content-Type';

export const JSON_CONTENT_TYPE = 'application/json';

export const BEARER_PREFIX = 'Bearer ';

export const POST_METHOD = 'POST';

export const PATCH_METHOD = 'PATCH';

export const HTTP_UNAUTHORIZED = 401;

export const HTTP_FORBIDDEN = 403;

export const HTTP_NOT_FOUND = 404;

export const HTTP_CONFLICT = 409;

export const HTTP_UNPROCESSABLE = 422;

/** How many times the whole commit cycle is retried when the branch moves underneath it. */
export const MAX_COMMIT_ATTEMPTS = 3;

/** Commit message template; append the event `dateIso`. */
export const COMMIT_MESSAGE_PREFIX = 'Публикация протокола: ';

/** Deletion commit message template; append the event `dateIso`. */
export const DELETE_COMMIT_MESSAGE_PREFIX = 'Удаление протокола: ';

export const GIT_BLOB_ENCODING = 'base64';

export const GIT_TREE_FILE_MODE = '100644';

export const GIT_TREE_BLOB_TYPE = 'blob';
