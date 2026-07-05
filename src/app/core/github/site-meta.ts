import { safeJsonParse } from './safe-json-parse';
import { EMPTY_SITE_META, SITE_META_SCHEMA_VERSION } from './site-meta.constant';
import { SiteMetaFile } from './site-meta.interface';

/** Parses `site-meta.json`; null, malformed JSON or an unexpected shape yields the empty meta. */
export function parseSiteMeta(text: string | null): SiteMetaFile {
  const parsed = safeJsonParse(text);

  return isSiteMetaFile(parsed) ? parsed : { ...EMPTY_SITE_META };
}

/** Normalises the organiser's raw form input into the file that gets committed. */
export function buildSiteMeta(startTime: string, announcement: string): SiteMetaFile {
  return { schemaVersion: SITE_META_SCHEMA_VERSION, startTime: startTime.trim(), announcement: announcement.trim() };
}

function isSiteMetaFile(value: unknown): value is SiteMetaFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === SITE_META_SCHEMA_VERSION &&
    'startTime' in value &&
    typeof value.startTime === 'string' &&
    'announcement' in value &&
    typeof value.announcement === 'string'
  );
}
