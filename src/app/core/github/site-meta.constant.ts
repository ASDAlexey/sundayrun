import { SiteMetaFile } from './site-meta.interface';

export const SITE_META_SCHEMA_VERSION = 1;

/** The meta before the organiser has published anything: no start time. */
export const EMPTY_SITE_META: SiteMetaFile = {
  schemaVersion: SITE_META_SCHEMA_VERSION,
  startTime: '',
};
