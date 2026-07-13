import { SITE_META_SCHEMA_VERSION } from './site-meta.constant';
import { SiteMetaFile } from './site-meta.interface';

export const EXISTING_SITE_META: SiteMetaFile = {
  schemaVersion: SITE_META_SCHEMA_VERSION,
  startTime: '08:00',
};

export const VALID_SITE_META_TEXT = JSON.stringify(EXISTING_SITE_META);

export const MALFORMED_SITE_META_TEXT = '{"schemaVersion":';

/** Right version, wrong field type: `startTime` must be a string. */
export const WRONG_SHAPE_SITE_META_TEXT = JSON.stringify({ schemaVersion: SITE_META_SCHEMA_VERSION, startTime: 8 });

/** A different start time — the course facts pick it up for the registration derivation. */
export const START_TIME_ONLY_SITE_META: SiteMetaFile = {
  schemaVersion: SITE_META_SCHEMA_VERSION,
  startTime: '09:00',
};

export const RAW_START_TIME_INPUT = ' 09:30 ';

export const BUILT_SITE_META: SiteMetaFile = {
  schemaVersion: SITE_META_SCHEMA_VERSION,
  startTime: '09:30',
};
