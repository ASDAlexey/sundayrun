import { safeJsonParse } from './safe-json-parse';
import { COMMIT_SHA_PATTERN } from './version-file.constant';
import { VersionFile } from './version-file.interface';

/** Extracts a plausible pinned-commit sha from a raw `version.json` body; anything else yields null. */
export function parseVersionSha(text: string | null): string | null {
  const parsed = safeJsonParse(text);

  return isVersionFile(parsed) && COMMIT_SHA_PATTERN.test(parsed.sha) ? parsed.sha : null;
}

function isVersionFile(value: unknown): value is VersionFile {
  return typeof value === 'object' && value !== null && 'sha' in value && typeof value.sha === 'string';
}
