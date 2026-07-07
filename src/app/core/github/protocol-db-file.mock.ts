import { CONTENTS_REF_QUERY, REPO_CONTENTS_URL } from './github-api.constant';
import { PROTOCOL_DB_PATH } from './protocols-repo.constant';

export const DB_TOKEN = 'db-token';

/** The published db as the Contents API serves it before the update. */
export const CURRENT_DB_BYTES = new Uint8Array([1, 2, 3, 4]);

/** What the wasm rebuild yields; committed as the base64 of exactly these bytes. */
export const UPDATED_DB_BYTES = new Uint8Array([5, 6, 7, 8, 9]);

export const DB_CONTENTS_KEY = `GET ${REPO_CONTENTS_URL}${PROTOCOL_DB_PATH}${CONTENTS_REF_QUERY}`;
