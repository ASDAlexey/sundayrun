import { CONTENTS_REF_QUERY_PREFIX, REPO_CONTENTS_URL } from './github-api.constant';
import { PROTOCOL_DB_PATH } from './protocols-repo.constant';

export const DB_TOKEN = 'db-token';

/** The commit the publication will hang off — the read has to be pinned to exactly this tree. */
export const DB_PARENT_SHA = 'parent-commit-sha';

/** The published db as the Contents API serves it before the update. */
export const CURRENT_DB_BYTES = new Uint8Array([1, 2, 3, 4]);

/** What the wasm rebuild yields; committed as the base64 of exactly these bytes. */
export const UPDATED_DB_BYTES = new Uint8Array([5, 6, 7, 8, 9]);

/**
 * The router key of the db download for one parent commit. It takes the ref because the read is
 * pinned per attempt now: a spec that stubs the Git Data API has to answer at the same sha its
 * head-ref route hands out, or the download silently falls through to the router's miss branch.
 */
export function dbContentsKey(parentSha: string): string {
  return `GET ${REPO_CONTENTS_URL}${PROTOCOL_DB_PATH}${CONTENTS_REF_QUERY_PREFIX}${parentSha}`;
}

export const DB_CONTENTS_KEY = dbContentsKey(DB_PARENT_SHA);
