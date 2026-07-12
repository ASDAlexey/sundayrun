/**
 * DDL for `data/sundayrun.db` — the single source of truth for the public archive. The browser
 * publish flow updates it in place, reading the previous state back out of it before each write;
 * a from-scratch rebuild recovers it from git history.
 *
 * Deliberately omitted as derivable: `bestMsByYear` (GROUP BY `substr(date_iso, 1, 4)`
 * over `runs`) and file paths (reconstructed from `slug`, see `github/event-paths.ts`).
 */

export const PROTOCOL_DB_SCHEMA_VERSION = '1';

export const PROTOCOL_DB_META_SCHEMA_VERSION_KEY = 'schemaVersion';

/** Mirrors `ArchiveIndexEntry` + `RaceEvent`; `club_name`/`chairman` are '' for legacy events. */
export const PROTOCOL_DB_CREATE_EVENTS_TABLE = `
CREATE TABLE events (
  slug TEXT PRIMARY KEY,
  date_iso TEXT NOT NULL,
  number REAL NOT NULL,
  city TEXT NOT NULL,
  park TEXT NOT NULL,
  club_name TEXT NOT NULL,
  chairman TEXT NOT NULL,
  participant_count INTEGER NOT NULL,
  finisher_count INTEGER,
  median_time_ms INTEGER,
  best_male_ms INTEGER,
  best_female_ms INTEGER
)`;

/** Mirrors `ProtocolRow`; `idx` is the row's `index` (a reserved word in SQL). */
export const PROTOCOL_DB_CREATE_RESULTS_TABLE = `
CREATE TABLE results (
  slug TEXT NOT NULL,
  idx INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  time23 TEXT NOT NULL,
  time5 TEXT NOT NULL,
  total_ms INTEGER,
  distance_km REAL,
  gender TEXT,
  place_m INTEGER,
  place_f INTEGER,
  club TEXT NOT NULL,
  note TEXT NOT NULL,
  PRIMARY KEY (slug, idx)
)`;

/** Mirrors `AthleteRecord` minus its per-run and per-participation arrays. */
export const PROTOCOL_DB_CREATE_ATHLETES_TABLE = `
CREATE TABLE athletes (
  key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  gender TEXT,
  best_ms INTEGER
)`;

/** Mirrors `AthleteRun`, keyed back to `athletes` via `athlete_key`. */
export const PROTOCOL_DB_CREATE_RUNS_TABLE = `
CREATE TABLE runs (
  athlete_key TEXT NOT NULL,
  date_iso TEXT NOT NULL,
  slug TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  distance_km REAL NOT NULL
)`;

/** Mirrors `participationSlugs`; includes DNF-only events, so distinct from `runs`. */
export const PROTOCOL_DB_CREATE_PARTICIPATIONS_TABLE = `
CREATE TABLE participations (
  athlete_key TEXT NOT NULL,
  slug TEXT NOT NULL,
  PRIMARY KEY (athlete_key, slug)
)`;

export const PROTOCOL_DB_CREATE_META_TABLE = `
CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;

export const PROTOCOL_DB_CREATE_RUNS_ATHLETE_KEY_INDEX = 'CREATE INDEX runs_athlete_key ON runs (athlete_key)';

export const PROTOCOL_DB_CREATE_EVENTS_DATE_ISO_INDEX = 'CREATE INDEX events_date_iso ON events (date_iso)';

/** Serves the records page top-N: `WHERE gender = ? ORDER BY best_ms LIMIT n`. */
export const PROTOCOL_DB_CREATE_ATHLETES_GENDER_BEST_MS_INDEX = 'CREATE INDEX athletes_gender_best_ms ON athletes (gender, best_ms)';

/** Full schema in application order; `results.slug` lookups are covered by the composite PK. */
export const PROTOCOL_DB_SCHEMA_STATEMENTS: readonly string[] = [
  PROTOCOL_DB_CREATE_EVENTS_TABLE,
  PROTOCOL_DB_CREATE_RESULTS_TABLE,
  PROTOCOL_DB_CREATE_ATHLETES_TABLE,
  PROTOCOL_DB_CREATE_RUNS_TABLE,
  PROTOCOL_DB_CREATE_PARTICIPATIONS_TABLE,
  PROTOCOL_DB_CREATE_META_TABLE,
  PROTOCOL_DB_CREATE_RUNS_ATHLETE_KEY_INDEX,
  PROTOCOL_DB_CREATE_EVENTS_DATE_ISO_INDEX,
  PROTOCOL_DB_CREATE_ATHLETES_GENDER_BEST_MS_INDEX,
];
