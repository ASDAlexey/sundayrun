/** The slice of the pre-bundled `sqlite-wasm-http` entry the read layer consumes. Type-only, so erased. */
export type SqliteHttpModule = Pick<typeof import('sqlite-wasm-http'), 'createSQLiteHTTPPool'>;

/** The dynamic-import seam `loadSqliteHttp` calls; the default wraps the native `@vite-ignore` `import()`. */
export type SqliteHttpImporter = (url: string) => Promise<SqliteHttpModule>;

/**
 * The injectable loader the service depends on; specs swap a fake in through the `SQLITE_HTTP_LOADER`
 * token. Production binds the resolved url, so the service calls it with no args; the optional
 * `importModule` seam lets the loader's own spec assert the import without a real network fetch.
 */
export type SqliteHttpLoader = (importModule?: SqliteHttpImporter) => Promise<SqliteHttpModule>;
