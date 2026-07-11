import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import type { SQLiteHTTPPool } from 'sqlite-wasm-http';

import { jsDelivrFileUrl } from '../core/github/jsdelivr';
import { PROTOCOL_DB_PATH } from '../core/github/protocols-repo.constant';
import { CdnRefService } from './cdn-ref.service';
import { narrowRow } from './protocol-db-narrow';
import {
  PROTOCOL_DB_BROWSER_ONLY_ERROR,
  PROTOCOL_DB_HTTP_OPTIONS,
  PROTOCOL_DB_QUERY_ATTEMPTS,
  PROTOCOL_DB_WORKER_COUNT,
} from './protocol-db.service.constant';
import { ProtocolDbBindings, ProtocolDbRow } from './protocol-db.service.type';
import { SQLITE_HTTP_LOADER } from './sqlite-http-loader';

/**
 * A virtual SQLite connection to the sha-pinned `data/protocol.db` on the jsDelivr CDN: the
 * WASM engine (loaded lazily, browser-only) fetches just the db pages a statement touches via
 * HTTP range requests, so a keyed lookup moves kilobytes instead of whole JSON files. Any
 * failure — the worker bootstrap, an unsupported range request, a missing db at the pinned
 * sha, the statement itself — rejects, and every caller falls back to the JSON path. During
 * prerender `query` rejects before touching the wasm module, keeping the static build clean.
 */
@Injectable({ providedIn: 'root' })
export class ProtocolDbService {
  readonly #cdnRef = inject(CdnRefService);
  readonly #loadSqliteHttp = inject(SQLITE_HTTP_LOADER);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  #poolRef = '';
  #pool: Promise<SQLiteHTTPPool> | null = null;

  /** Rows as plain objects keyed by the column aliases of `sql`, narrowed to the db's value kinds. */
  async query(sql: string, bindings?: ProtocolDbBindings): Promise<ProtocolDbRow[]> {
    if (!this.#isBrowser) {
      throw new Error(PROTOCOL_DB_BROWSER_ONLY_ERROR);
    }

    return this.#queryWithRetry(sql, bindings, PROTOCOL_DB_QUERY_ATTEMPTS);
  }

  /**
   * A failed attempt evicts the half-made pool (see `#poolFor`), so retrying reconnects over a fresh
   * pool — enough to ride out a single transient range failure now that no JSON fallback follows.
   */
  async #queryWithRetry(sql: string, bindings: ProtocolDbBindings | undefined, attemptsLeft: number): Promise<ProtocolDbRow[]> {
    try {
      const pool = await this.#poolFor(await this.#cdnRef.resolve());
      const results = await pool.exec(sql, bindings, { rowMode: 'object' });

      return results.map((result) => narrowRow(result.row));
    } catch (error) {
      if (attemptsLeft <= 1) {
        throw error;
      }

      return this.#queryWithRetry(sql, bindings, attemptsLeft - 1);
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

  /** The dynamic import keeps every wasm/worker byte out of the initial bundle and the prerender. */
  async #openPool(ref: string): Promise<SQLiteHTTPPool> {
    const { createSQLiteHTTPPool } = await this.#loadSqliteHttp();
    const pool = await createSQLiteHTTPPool({ workers: PROTOCOL_DB_WORKER_COUNT, httpOptions: PROTOCOL_DB_HTTP_OPTIONS });

    try {
      await pool.open(jsDelivrFileUrl(PROTOCOL_DB_PATH, ref));
    } catch (error) {
      void pool.close().catch(() => undefined);
      throw error;
    }

    return pool;
  }
}
