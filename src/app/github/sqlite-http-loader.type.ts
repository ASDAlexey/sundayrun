/** The slice of the pre-bundled `sqlite-wasm-http` entry the read layer consumes. Type-only, so erased. */
export type SqliteHttpModule = Pick<typeof import('sqlite-wasm-http'), 'createSQLiteHTTPPool'>;

/** The dynamic-import seam `loadSqliteHttp` calls; the default wraps the native `@vite-ignore` `import()`. */
export type SqliteHttpImporter = (url: string) => Promise<SqliteHttpModule>;

/** The injectable loader the service depends on; specs swap a fake in through the `SQLITE_HTTP_LOADER` token. */
export type SqliteHttpLoader = () => Promise<SqliteHttpModule>;
