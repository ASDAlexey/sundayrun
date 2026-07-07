export const VERSION_FILE_SCHEMA_VERSION = 1;

/** A full 40-char lowercase hex commit sha; anything else in `version.json` is treated as corrupt. */
export const COMMIT_SHA_PATTERN = /^[\da-f]{40}$/;
