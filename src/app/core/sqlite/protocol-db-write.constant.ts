/** 1 KiB pages keep the read side's HTTP range requests fine-grained; must run before any DDL (docs/SQLITE_DB.md). */
export const PROTOCOL_DB_PAGE_SIZE_PRAGMA = 'PRAGMA page_size = 1024';

export const PROTOCOL_DB_MAIN_SCHEMA = 'main';

export const BEGIN_TRANSACTION_SQL = 'BEGIN';

export const COMMIT_TRANSACTION_SQL = 'COMMIT';

/** Compacts the pages freed by the full-table rewrites, so the artifact never grows commit over commit. */
export const VACUUM_SQL = 'VACUUM';
