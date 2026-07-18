/** 4 KiB pages: fewer HTTP range requests than 1 KiB (measured ~227→159 on the home page, Load 1.70s→0.77s) with barely any file growth. Must run before any DDL (docs/SQLITE_DB.md); read side's `maxPageSize` must match. */
export const PROTOCOL_DB_PAGE_SIZE_PRAGMA = 'PRAGMA page_size = 4096';

export const PROTOCOL_DB_MAIN_SCHEMA = 'main';

export const BEGIN_TRANSACTION_SQL = 'BEGIN';

export const COMMIT_TRANSACTION_SQL = 'COMMIT';

/** Compacts the pages freed by the full-table rewrites, so the artifact never grows commit over commit. */
export const VACUUM_SQL = 'VACUUM';
