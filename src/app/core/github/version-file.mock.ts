import { VERSION_FILE_SCHEMA_VERSION } from './version-file.constant';

/** A plausible (full 40-char hex) sha as served inside `version.json`. */
export const VERSION_POINTER_SHA_MOCK = '0d6fc34b8f2e97800d115a8761faad90c53f59c0';

export const VERSION_POINTER_RESPONSE_TEXT = JSON.stringify({ schemaVersion: VERSION_FILE_SCHEMA_VERSION, sha: VERSION_POINTER_SHA_MOCK });

/** A pointer whose sha cannot be a full commit sha. */
export const SHORT_SHA_VERSION_RESPONSE_TEXT = JSON.stringify({ schemaVersion: VERSION_FILE_SCHEMA_VERSION, sha: '0d6fc34' });

/** A pointer whose sha is not even a string. */
export const NUMERIC_SHA_VERSION_RESPONSE_TEXT = JSON.stringify({ schemaVersion: VERSION_FILE_SCHEMA_VERSION, sha: 40 });

/** Valid JSON of the wrong shapes: not an object and an object without a sha. */
export const NON_OBJECT_VERSION_RESPONSE_TEXT = JSON.stringify(VERSION_POINTER_SHA_MOCK);

export const SHALESS_VERSION_RESPONSE_TEXT = JSON.stringify({ schemaVersion: VERSION_FILE_SCHEMA_VERSION });

export const MALFORMED_VERSION_RESPONSE_TEXT = '{not json';
