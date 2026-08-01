import { pinnedProtocolDbPath } from '../core/github/protocol-db-path';
import { PROTOCOL_DB_PATH } from '../core/github/protocols-repo.constant';
import { CDN_REF_SHA_MOCK } from './cdn-ref.service.mock';

/** The deploy base href the fake DOCUMENT reports, mirroring the `/sundayrun/` Pages sub-path. */
export const DB_BASE_URI_MOCK = 'https://sundayrun.example/sundayrun/';

/** The `DOCUMENT` stub the service resolves the db url against — only `baseURI` is read. */
export const DOCUMENT_MOCK: Pick<Document, 'baseURI'> = { baseURI: DB_BASE_URI_MOCK };

/** Mirrors `#dbUrl`: a db path resolved against the base href. */
function sameOriginDbUrl(path: string): string {
  return new URL(path, DB_BASE_URI_MOCK).href;
}

/** The sha-named url the Pages `dbSource` downloads once the session's data commit is deployed. */
export const PROTOCOL_DB_URL = sameOriginDbUrl(pinnedProtocolDbPath(CDN_REF_SHA_MOCK));

/** The plain-named url read while the deploy carrying the session's data commit is in flight. */
export const FALLBACK_PROTOCOL_DB_URL = sameOriginDbUrl(PROTOCOL_DB_PATH);

/** The commit an admin publication pins mid-session, re-pointing the connection. */
export const PINNED_SHA_MOCK = 'freshly-published-sha';

export const PINNED_PROTOCOL_DB_URL = sameOriginDbUrl(pinnedProtocolDbPath(PINNED_SHA_MOCK));

/** The dev-server url the local `dbSource` reads directly, without a base-href resolve. */
export const LOCAL_DB_URL_MOCK = '/data/sundayrun.db';

/** Stand-in for the downloaded db image; the fake wasm engine never parses it. */
export const DB_BYTES_MOCK = new Uint8Array([83, 81, 76, 105]);

export const DB_SQL_MOCK = 'SELECT slug, number, note, digest FROM events WHERE full_name = ?';

/** Positional params bound `?`-style, exactly as drizzle's proxy driver hands them over. */
export const DB_PARAMS_MOCK = ['иванов иван'];

/**
 * The raw rows the wasm boundary returns as positional value arrays, spanning every value kind the
 * service must narrow: a string, a number, a SQL null and a blob (a non number|string|null that
 * folds to null).
 */
export const DB_RAW_ROWS_MOCK = [
  ['2026-06-21', 12, null, new Uint8Array([1])],
  ['2026-06-28', 42, null, new Uint8Array([2])],
];

/** The same rows after narrowing: the blob is the only value that changes, folding to null. */
export const DB_ROWS_MOCK = [
  ['2026-06-21', 12, null, null],
  ['2026-06-28', 42, null, null],
];

/** What Pages answers for a db path that is not deployed yet. */
export const DB_MISSING_STATUS = 404;

export const DB_NETWORK_ERROR_MESSAGE = 'connection reset';

export const DB_EXEC_ERROR_MESSAGE = 'statement failed';

export const DB_CLOSE_ERROR_MESSAGE = 'close failed';

/** The generic db failure the consumer service specs use to drive their error states. */
export const PROTOCOL_DB_ERROR_MESSAGE = 'sundayrun.db unreachable';
