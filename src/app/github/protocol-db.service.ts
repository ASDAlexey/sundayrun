import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';

import type { SQLiteHTTPPool } from 'sqlite-wasm-http';

import { environment } from '../../environments/environment';
import { pinnedProtocolDbPath } from '../core/github/protocol-db-path';
import { PROTOCOL_DB_PATH } from '../core/github/protocols-repo.constant';
import { DbSource } from '../core/sqlite/db-source.enum';
import { ProtocolDbValue } from '../core/sqlite/protocol-db-value.type';
import { CdnRefService } from './cdn-ref.service';
import { DbFreshnessService } from './db-freshness.service';
import { narrowValues } from '../core/sqlite/protocol-db-narrow';
import {
  PROTOCOL_DB_BROWSER_ONLY_ERROR,
  PROTOCOL_DB_HTTP_OPTIONS,
  PROTOCOL_DB_LOCAL_POOL_REF,
  PROTOCOL_DB_QUERY_ATTEMPTS,
  PROTOCOL_DB_WORKER_COUNT,
} from './protocol-db.service.constant';
import { SQLITE_HTTP_LOADER } from './sqlite-http-loader';

/**
 * A virtual SQLite connection to `data/sundayrun.db`: the WASM engine (loaded lazily,
 * browser-only) fetches just the db pages a statement touches via HTTP range requests, so a
 * keyed lookup moves kilobytes instead of whole JSON files. The db is read same-origin — the
 * copy bundled into the GitHub Pages deploy in production, or the dev server's on-disk copy in
 * local development (which skips the CDN ref lookup entirely). Same-origin is deliberate: the
 * public CDNs mangle range requests (jsDelivr ranges over the brotli-compressed file; others
 * stall on deep offsets or 403 the HEAD), while GitHub Pages' own host serves clean ranges.
 * Any failure — the worker bootstrap, an unsupported range request, a missing db, the statement
 * itself — rejects, and every caller falls back to the JSON path. During prerender `query`
 * rejects before touching the wasm module, keeping the static build clean.
 *
 * Cache freshness rides on the file *name*, not a query string: SQLite parses the open target as
 * a URI and strips any `?…` before the VFS sees it, so a `?v=` buster never reaches HTTP. Instead
 * the deploy bundles a copy named by the data commit (see `pinnedProtocolDbPath`), and the plain
 * name is the fallback read while `DbFreshnessService` reports that copy's deploy still in flight.
 */
@Injectable({ providedIn: 'root' })
export class ProtocolDbService {
  readonly #cdnRef = inject(CdnRefService);
  readonly #freshness = inject(DbFreshnessService);
  readonly #loadSqliteHttp = inject(SQLITE_HTTP_LOADER);
  readonly #document = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  #poolRef = '';
  #pool: Promise<SQLiteHTTPPool> | null = null;

  /** Rows as positional value arrays for the columns of `sql`, narrowed to the db's value kinds. */
  async queryValues(sql: string, params: readonly ProtocolDbValue[]): Promise<ProtocolDbValue[][]> {
    if (!this.#isBrowser) {
      throw new Error(PROTOCOL_DB_BROWSER_ONLY_ERROR);
    }

    return this.#queryWithRetry(sql, params, PROTOCOL_DB_QUERY_ATTEMPTS);
  }

  /**
   * A failed attempt evicts the half-made pool (see `#poolFor`), so retrying reconnects over a fresh
   * pool — enough to ride out a single transient range failure now that no JSON fallback follows.
   */
  async #queryWithRetry(sql: string, params: readonly ProtocolDbValue[], attemptsLeft: number): Promise<ProtocolDbValue[][]> {
    try {
      const pool = await this.#poolFor(await this.#resolveRef());
      const results = await pool.exec(sql, [...params], { rowMode: 'array' });

      return results.map((result) => narrowValues(result.row));
    } catch (error) {
      if (attemptsLeft <= 1) {
        throw error;
      }

      return this.#queryWithRetry(sql, params, attemptsLeft - 1);
    }
  }

  /**
   * One pool per data version, cached for the session like the JSON reads: a `pin` after a
   * publication swaps in a pool over the new sha and lets the old one close in the background.
   * A failed open is evicted from the cache, so a later query can retry the connection.
   */
  #poolFor(ref: string): Promise<SQLiteHTTPPool> {
    if (this.#pool === null || this.#poolRef !== ref) {
      void this.#pool?.then((pool) => pool.close()).catch(() => undefined);
      this.#poolRef = ref;
      this.#pool = this.#openPool(ref).catch((error: unknown) => {
        this.#pool = null;
        throw error;
      });
    }

    return this.#pool;
  }

  /** Local reads a fixed on-disk url, so it needs no sha; Pages uses the data sha as a cache-buster. */
  #resolveRef(): Promise<string> {
    return environment.dbSource === DbSource.Local ? Promise.resolve(PROTOCOL_DB_LOCAL_POOL_REF) : this.#cdnRef.resolve();
  }

  /**
   * The dev server's on-disk copy in local mode; otherwise the deploy-bundled db resolved against
   * the base href (so it survives the deploy sub-path, like the self-hosted fonts and wasm). The
   * sha-named copy is preferred — its url moves with every publication, so no cache can hold it
   * stale — and the plain name covers the deploy-in-flight window on the previous data.
   */
  async #dbUrl(ref: string): Promise<string> {
    if (environment.dbSource === DbSource.Local) {
      return environment.localDbUrl;
    }

    const path = (await this.#freshness.pinnedDbAvailable(ref)) ? pinnedProtocolDbPath(ref) : PROTOCOL_DB_PATH;

    return new URL(path, this.#document.baseURI).href;
  }

  /** The dynamic import keeps every wasm/worker byte out of the initial bundle and the prerender. */
  async #openPool(ref: string): Promise<SQLiteHTTPPool> {
    const url = await this.#dbUrl(ref);
    const { createSQLiteHTTPPool } = await this.#loadSqliteHttp();
    const pool = await createSQLiteHTTPPool({ workers: PROTOCOL_DB_WORKER_COUNT, httpOptions: PROTOCOL_DB_HTTP_OPTIONS });

    try {
      await pool.open(url);
    } catch (error) {
      void pool.close().catch(() => undefined);
      throw error;
    }

    return pool;
  }
}
