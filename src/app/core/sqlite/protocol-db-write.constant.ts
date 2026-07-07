import { ProtocolDbEventMeta } from './protocol-db-write.interface';

/** 1 KiB pages keep the read side's HTTP range requests fine-grained; must run before any DDL (docs/SQLITE_DB.md). */
export const PROTOCOL_DB_PAGE_SIZE_PRAGMA = 'PRAGMA page_size = 1024';

export const PROTOCOL_DB_MAIN_SCHEMA = 'main';

export const BEGIN_TRANSACTION_SQL = 'BEGIN';

export const COMMIT_TRANSACTION_SQL = 'COMMIT';

/** Compacts the pages freed by the full-table rewrites, so the artifact never grows commit over commit. */
export const VACUUM_SQL = 'VACUUM';

export const SELECT_EVENT_META_SQL = 'SELECT slug, club_name, chairman FROM events';

export const DELETE_ALL_EVENTS_SQL = 'DELETE FROM events';

export const DELETE_ALL_ATHLETES_SQL = 'DELETE FROM athletes';

export const DELETE_ALL_RUNS_SQL = 'DELETE FROM runs';

export const DELETE_ALL_PARTICIPATIONS_SQL = 'DELETE FROM participations';

export const DELETE_RESULTS_BY_SLUG_SQL = 'DELETE FROM results WHERE slug = ?';

export const INSERT_EVENT_SQL = 'INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

export const INSERT_RESULT_SQL = 'INSERT INTO results VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

export const INSERT_ATHLETE_SQL = 'INSERT INTO athletes VALUES (?, ?, ?, ?)';

export const INSERT_RUN_SQL = 'INSERT INTO runs VALUES (?, ?, ?, ?, ?)';

export const INSERT_PARTICIPATION_SQL = 'INSERT INTO participations VALUES (?, ?)';

export const UPSERT_META_SQL = 'INSERT OR REPLACE INTO meta VALUES (?, ?)';

/** Matches `protocol-db-schema.constant.ts`: club fields are '' when no results file ever provided them. */
export const EMPTY_EVENT_META: ProtocolDbEventMeta = { clubName: '', chairman: '' };
