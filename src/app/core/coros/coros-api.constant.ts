import { CorosRegion, CorosRegionType } from './coros-region.enum';

/**
 * Training Hub hosts per region. Verified live on 27.07.2026: they answer CORS with the calling
 * origin reflected and allow the `accesstoken` header, so the browser talks to them directly.
 */
export const COROS_REGION_API_URLS: Record<CorosRegionType, string> = {
  [CorosRegion.Eu]: 'https://teameuapi.coros.com',
  [CorosRegion.Global]: 'https://teamapi.coros.com',
  [CorosRegion.Cn]: 'https://teamcnapi.coros.com',
};

/** Email-and-password login, as opposed to the social sign-in types we do not support. */
export const COROS_ACCOUNT_TYPE = 2;

/** Every Coros response carries a code; anything but this is a failure whatever the HTTP status. */
export const COROS_OK_RESULT = '0000';

/** Activity mode filter: plain «Run» (102 is trail, 103 track) — the only one a race can be. */
export const COROS_RUN_MODE_LIST = '100';

export const COROS_RUN_SPORT_TYPE = 100;

/** `fileType` of the download endpoint: 1=gpx, 2=kml, 3=tcx, 4=fit, 0=csv. */
export const COROS_GPX_FILE_TYPE = 1;

/** A Sunday holds a handful of activities at most, so one page always covers a race day. */
export const COROS_QUERY_PAGE_SIZE = 200;

/** Lowercase on purpose — the API rejects the capitalised spelling. */
export const COROS_TOKEN_HEADER = 'accesstoken';

/** Where the web UI keeps the session token; read once when adopting an already-open session. */
export const COROS_TOKEN_COOKIE = 'CPL-coros-token';

/** Slice bounds of the `YYYYMMDD` day Coros speaks, for translating to and from ISO dates. */
export const COROS_DAY_YEAR_END = 4;

export const COROS_DAY_MONTH_END = 6;

export const COROS_DAY_LENGTH = 8;
