import {
  COROS_ACCOUNT_TYPE,
  COROS_DAY_LENGTH,
  COROS_DAY_MONTH_END,
  COROS_DAY_YEAR_END,
  COROS_GPX_FILE_TYPE,
  COROS_OK_RESULT,
  COROS_QUERY_PAGE_SIZE,
  COROS_REGION_API_URLS,
  COROS_RUN_MODE_LIST,
  COROS_RUN_SPORT_TYPE,
  COROS_TOKEN_HEADER,
} from './coros-api.constant';
import { CorosApiError } from './coros-api.error';
import { CorosActivity, CorosActivityRow, CorosDownloadData, CorosLoginData, CorosQueryData, CorosResponse } from './coros-api.interface';
import { CorosFetchFn } from './coros-fetch.type';
import { md5Hex } from './coros-md5';
import { CorosRegionType } from './coros-region.enum';

/** Default fetch for production use; wraps the global fetch to keep its `this` binding intact. */
const DEFAULT_COROS_FETCH: CorosFetchFn = (url, init) => fetch(url, init);

/**
 * Exchanges an account password for a session token.
 *
 * The password is hashed here and never leaves the device in the clear — and it is never stored
 * anywhere either: only the returned token is worth keeping.
 */
export async function corosLogin(
  email: string,
  password: string,
  region: CorosRegionType,
  fetchFn: CorosFetchFn = DEFAULT_COROS_FETCH,
): Promise<string> {
  const body = JSON.stringify({ accountType: COROS_ACCOUNT_TYPE, account: email, pwd: md5Hex(password) });
  const response = await fetchFn(`${COROS_REGION_API_URLS[region]}/account/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  const token = unwrap<CorosLoginData>(await readJson(response)).accessToken;

  if (token === undefined || token === '') {
    throw new CorosApiError('Coros login returned no token', undefined);
  }

  return token;
}

/**
 * Runs recorded between two ISO dates, inclusive.
 *
 * The date window is applied by Coros itself (`startDay`/`endDay`), so asking about three race
 * Sundays costs one request rather than a walk through hundreds of activities. Note the parameter
 * names: with `from`/`to` the filter is silently ignored and the first page comes back instead.
 */
export async function corosQueryRuns(
  token: string,
  startDateIso: string,
  endDateIso: string,
  region: CorosRegionType,
  fetchFn: CorosFetchFn = DEFAULT_COROS_FETCH,
): Promise<CorosActivity[]> {
  const query = new URLSearchParams({
    size: String(COROS_QUERY_PAGE_SIZE),
    pageNumber: '1',
    startDay: corosDayOf(startDateIso),
    endDay: corosDayOf(endDateIso),
    modeList: COROS_RUN_MODE_LIST,
  });
  const response = await fetchFn(`${COROS_REGION_API_URLS[region]}/activity/query?${query}`, {
    headers: { [COROS_TOKEN_HEADER]: token },
  });
  const rows = unwrap<CorosQueryData>(await readJson(response)).dataList ?? [];

  return rows.reduce<CorosActivity[]>((activities, row) => {
    const activity = toActivity(row);

    return activity === null ? activities : [...activities, activity];
  }, []);
}

/**
 * The GPX of one activity, as text.
 *
 * Two hops: the API hands out a CDN link, the CDN hands out the file. The second request carries
 * no headers at all on purpose — the CDN answers `OPTIONS` with 403, so anything that would
 * trigger a preflight (a token header, a custom accept) turns a working download into a CORS
 * failure. The link itself is unsigned, hence used once and never kept.
 */
export async function corosDownloadGpx(
  token: string,
  labelId: string,
  region: CorosRegionType,
  fetchFn: CorosFetchFn = DEFAULT_COROS_FETCH,
): Promise<string> {
  const query = new URLSearchParams({
    labelId,
    sportType: String(COROS_RUN_SPORT_TYPE),
    fileType: String(COROS_GPX_FILE_TYPE),
  });
  const response = await fetchFn(`${COROS_REGION_API_URLS[region]}/activity/detail/download?${query}`, {
    method: 'POST',
    headers: { [COROS_TOKEN_HEADER]: token },
  });
  const fileUrl = unwrap<CorosDownloadData>(await readJson(response)).fileUrl;

  if (fileUrl === undefined || fileUrl === '') {
    throw new CorosApiError(`Coros has no file for activity ${labelId}`, undefined);
  }

  const file = await fetchFn(fileUrl);

  if (!file.ok) {
    throw new CorosApiError(`Coros file download failed with ${file.status}`, undefined);
  }

  return await file.text();
}

/** ISO date to the `YYYYMMDD` day Coros filters by. */
export function corosDayOf(dateIso: string): string {
  return dateIso.replaceAll('-', '');
}

/** The `YYYYMMDD` day Coros reports back to an ISO date. */
export function isoDateOfCorosDay(day: number): string | null {
  const digits = String(day);

  if (digits.length !== COROS_DAY_LENGTH) {
    return null;
  }

  return `${digits.slice(0, COROS_DAY_YEAR_END)}-${digits.slice(COROS_DAY_YEAR_END, COROS_DAY_MONTH_END)}-${digits.slice(COROS_DAY_MONTH_END)}`;
}

/** A row missing any field we match races on is dropped rather than guessed at. */
function toActivity(row: CorosActivityRow): CorosActivity | null {
  const dateIso = row.date === undefined ? null : isoDateOfCorosDay(row.date);

  if (
    row.labelId === undefined ||
    dateIso === null ||
    row.distance === undefined ||
    row.totalTime === undefined ||
    row.sportType === undefined
  ) {
    return null;
  }

  return {
    labelId: row.labelId,
    dateIso,
    distanceM: row.distance,
    totalTimeS: row.totalTime,
    sportType: row.sportType,
    name: row.name ?? '',
  };
}

/** Coros reports failures in the body, so a 200 with a bad `result` is still a failure. */
function unwrap<T>(body: CorosResponse<T>): T {
  if (body.result !== COROS_OK_RESULT || body.data === undefined) {
    throw new CorosApiError(body.message ?? 'Coros request failed', body.result);
  }

  return body.data;
}

async function readJson<T>(response: Response): Promise<CorosResponse<T>> {
  if (!response.ok) {
    throw new CorosApiError(`Coros request failed with ${response.status}`, undefined);
  }

  try {
    const body: CorosResponse<T> = await response.json();

    return body;
  } catch {
    throw new CorosApiError('Coros answered with something that is not JSON', undefined);
  }
}
