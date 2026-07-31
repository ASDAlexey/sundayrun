/**
 * DDL for `data/sundayrun.db` — the single source of truth for the public archive. The browser
 * publish flow updates it in place, reading the previous state back out of it before each write;
 * a from-scratch rebuild recovers it from git history.
 *
 * Deliberately omitted as derivable: `bestMsByYear` (GROUP BY `substr(date_iso, 1, 4)`
 * over `runs`) and file paths (reconstructed from `slug`, see `github/event-paths.ts`).
 */

export const PROTOCOL_DB_SCHEMA_VERSION = '8';

export const PROTOCOL_DB_META_SCHEMA_VERSION_KEY = 'schemaVersion';

/**
 * The `meta` key holding the JSON-encoded site-wide totals (`OverallStats`), materialised at
 * write time so the home page reads one keyed row instead of scanning `runs` three times over
 * HTTP range requests. Absent on dbs published before this key existed — readers fall back to
 * the on-the-fly aggregate then.
 */
export const PROTOCOL_DB_META_OVERALL_STATS_KEY = 'overallStats';

/** Mirrors `ArchiveIndexEntry` + `RaceEvent`; `club_name`/`chairman` are '' for legacy events. */
export const PROTOCOL_DB_CREATE_EVENTS_TABLE = `
CREATE TABLE events (
  slug TEXT PRIMARY KEY,
  date_iso TEXT NOT NULL,
  number REAL NOT NULL,
  legacy_number TEXT,
  city TEXT NOT NULL,
  park TEXT NOT NULL,
  club_name TEXT NOT NULL,
  chairman TEXT NOT NULL,
  participant_count INTEGER NOT NULL,
  finisher_count INTEGER,
  median_time_ms INTEGER,
  median_male_ms INTEGER,
  median_female_ms INTEGER,
  best_male_ms INTEGER,
  best_female_ms INTEGER,
  newcomer_count INTEGER,
  personal_record_count INTEGER
)`;

/** v2 → v3: the note-derived counters; applied to the local db by `scripts/backfill-summary-counts.ts`. */
export const PROTOCOL_DB_V3_MIGRATION_STATEMENTS: readonly string[] = [
  'ALTER TABLE events ADD COLUMN newcomer_count INTEGER',
  'ALTER TABLE events ADD COLUMN personal_record_count INTEGER',
];

/** v3 → v4: the per-gender 5 km medians; applied to the local db by `scripts/backfill-gender-medians.ts`. */
export const PROTOCOL_DB_V4_MIGRATION_STATEMENTS: readonly string[] = [
  'ALTER TABLE events ADD COLUMN median_male_ms INTEGER',
  'ALTER TABLE events ADD COLUMN median_female_ms INTEGER',
];

/**
 * Mirrors `EventWeather` (see `core/weather`), keyed by the event slug: the 9:00 course readings
 * fetched at publish time, plus the rain of the wet-course window around them. IF NOT EXISTS lets
 * the same DDL double as the v4 → v5 migration, which the write path applies to any pre-v5 bytes it
 * deserializes.
 */
export const PROTOCOL_DB_CREATE_EVENT_WEATHER_TABLE = `
CREATE TABLE IF NOT EXISTS event_weather (
  slug TEXT PRIMARY KEY,
  temperature_c REAL,
  apparent_c REAL,
  precipitation_mm REAL,
  wind_kmh REAL,
  weather_code INTEGER,
  recent_precipitation_mm REAL
)`;

/** v4 → v5: the per-event weather; applied to the local db by `scripts/backfill-weather.ts`. */
export const PROTOCOL_DB_V5_MIGRATION_STATEMENTS: readonly string[] = [PROTOCOL_DB_CREATE_EVENT_WEATHER_TABLE];

/** The v6 column, named apart so both migration paths can ask whether the table already has it. */
export const PROTOCOL_DB_RECENT_PRECIPITATION_COLUMN = 'recent_precipitation_mm';

/**
 * v5 → v6: the wet-course window's rain. `ALTER TABLE` has no IF NOT EXISTS, so unlike the v5 DDL
 * these statements are not self-guarding — both callers (the write path and
 * `scripts/backfill-weather.ts`) run them only when `PROTOCOL_DB_RECENT_PRECIPITATION_COLUMN` is
 * missing from `event_weather`.
 */
export const PROTOCOL_DB_V6_MIGRATION_STATEMENTS: readonly string[] = [
  `ALTER TABLE event_weather ADD COLUMN ${PROTOCOL_DB_RECENT_PRECIPITATION_COLUMN} REAL`,
];

/** The `event_weather` columns of a freshly created (or fully migrated) db, in declaration order. */
export const PROTOCOL_DB_EVENT_WEATHER_COLUMNS_SQL = `SELECT name FROM pragma_table_info('event_weather')`;

/**
 * The community's wall post carrying the event's photographs, keyed by the event slug. A table of
 * its own rather than an `events` column because `rewriteEvents` rebuilds `events` from the archive
 * index on every publication, which knows nothing of VK; like `event_weather`, this survives that
 * rewrite untouched. IF NOT EXISTS lets the same DDL double as the v6 → v7 migration.
 */
export const PROTOCOL_DB_CREATE_EVENT_VK_POST_TABLE = `
CREATE TABLE IF NOT EXISTS event_vk_post (
  slug TEXT PRIMARY KEY,
  post_url TEXT NOT NULL
)`;

/** v6 → v7: the per-event VK post link; filled by `scripts/backfill-vk-posts.ts`. */
export const PROTOCOL_DB_V7_MIGRATION_STATEMENTS: readonly string[] = [PROTOCOL_DB_CREATE_EVENT_VK_POST_TABLE];

/**
 * The individual photographs of an event's wall post, in the order the post attached them: the
 * thumbnail the protocol's strip renders and the large one its viewer opens. Both are VK CDN urls —
 * the images are never copied into this repository, the visitor's browser fetches them once and
 * serves them from its own HTTP cache afterwards. VK signs those urls, so they can rot; the strip
 * treats a failed image as absent and `scripts/backfill-vk-posts.ts` refreshes them on a re-run.
 * `photo_url` is the permanent `vk.com/photo…` page, which never rots.
 */
export const PROTOCOL_DB_CREATE_EVENT_PHOTO_TABLE = `
CREATE TABLE IF NOT EXISTS event_photo (
  slug TEXT NOT NULL,
  idx INTEGER NOT NULL,
  preview_url TEXT NOT NULL,
  large_url TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  PRIMARY KEY (slug, idx)
)`;

/** v7 → v8: the per-event photo strip; filled by `scripts/backfill-vk-posts.ts`. */
export const PROTOCOL_DB_V8_MIGRATION_STATEMENTS: readonly string[] = [PROTOCOL_DB_CREATE_EVENT_PHOTO_TABLE];

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
  PROTOCOL_DB_CREATE_EVENT_WEATHER_TABLE,
  PROTOCOL_DB_CREATE_EVENT_VK_POST_TABLE,
  PROTOCOL_DB_CREATE_EVENT_PHOTO_TABLE,
  PROTOCOL_DB_CREATE_RESULTS_TABLE,
  PROTOCOL_DB_CREATE_ATHLETES_TABLE,
  PROTOCOL_DB_CREATE_RUNS_TABLE,
  PROTOCOL_DB_CREATE_PARTICIPATIONS_TABLE,
  PROTOCOL_DB_CREATE_META_TABLE,
  PROTOCOL_DB_CREATE_RUNS_ATHLETE_KEY_INDEX,
  PROTOCOL_DB_CREATE_EVENTS_DATE_ISO_INDEX,
  PROTOCOL_DB_CREATE_ATHLETES_GENDER_BEST_MS_INDEX,
];
