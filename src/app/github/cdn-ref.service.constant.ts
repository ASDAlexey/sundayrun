/** sessionStorage key of the freshest pointer sha the freshness check discovered this tab. */
export const FRESH_SHA_STORAGE_KEY = 'sundayrun.freshDataSha';

/** Past this age the raw pointer has long caught up (its cache bound is five minutes), so raw wins. */
export const FRESH_SHA_TTL_MS = 600_000;
