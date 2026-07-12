export const PROTOCOLS_REPO_OWNER = 'ASDAlexey';

/** App code and published data share one public repository; data lives under `data/`. */
export const PROTOCOLS_REPO_NAME = 'sundayrun';

export const PROTOCOLS_REPO_BRANCH = 'main';

/** Root of all published data inside the repository. */
export const DATA_DIRECTORY = 'data/';

export const SITE_META_JSON_PATH = `${DATA_DIRECTORY}site-meta.json`;

/** Version pointer: the only file read via the branch url; every other data url is sha-pinned. */
export const VERSION_JSON_PATH = `${DATA_DIRECTORY}version.json`;

/** The SQLite database: the single source of truth for the archive; read via http range requests, sha-pinned. */
export const PROTOCOL_DB_PATH = `${DATA_DIRECTORY}sundayrun.db`;

/** Per-event files live under `data/events/<dateIso>/`. */
export const EVENTS_DIRECTORY = `${DATA_DIRECTORY}events/`;

export const SOURCE_XLSX_FILE = 'source.xlsx';

export const RESULTS_JSON_FILE = 'results.json';
