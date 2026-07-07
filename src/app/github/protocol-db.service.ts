import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import type { SQLiteHTTPPool } from 'sqlite-wasm-http';

import { jsDelivrFileUrl } from '../core/github/jsdelivr';
import { PROTOCOL_DB_PATH } from '../core/github/protocols-repo.constant';
import { CdnRefService } from './cdn-ref.service';
import { PROTOCOL_DB_BROWSER_ONLY_ERROR, PROTOCOL_DB_HTTP_OPTIONS, PROTOCOL_DB_WORKER_COUNT } from './protocol-db.service.constant';
import { ProtocolDbBindings, ProtocolDbRow, ProtocolDbValue } from './protocol-db.service.type';

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
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  #poolRef = '';
  #pool: Promise<SQLiteHTTPPool> | null = null;

  /** Rows as plain objects keyed by the column aliases of `sql`, narrowed to the db's value kinds. */
  async query(sql: string, bindings?: ProtocolDbBindings): Promise<ProtocolDbRow[]> {
    if (!this.#isBrowser) {
      throw new Error(PROTOCOL_DB_BROWSER_ONLY_ERROR);
    }

    const pool = await this.#poolFor(await this.#cdnRef.resolve());
    const results = await pool.exec(sql, bindings, { rowMode: 'object' });

    return results.map((result) => narrowRow(result.row));
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
    const { createSQLiteHTTPPool } = await import('sqlite-wasm-http');
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

/**
 * The wasm boundary hands back `Record<string, SQLValue>` — a wider union than the number/string/null
 * `protocol.db` actually stores. Rebuilding the row with `narrowValue` turns that external shape into a
 * `ProtocolDbRow` by construction, so the read layer never resorts to a type assertion.
 */
function narrowRow(row: Record<string, unknown>): ProtocolDbRow {
  const narrowed: ProtocolDbRow = {};

  for (const [columnName, value] of Object.entries(row)) {
    narrowed[columnName] = narrowValue(value);
  }

  return narrowed;
}

/** Keeps the number/string/null the db holds; anything else (a stray blob) folds to null. */
function narrowValue(value: unknown): ProtocolDbValue {
  if (typeof value === 'number' || typeof value === 'string' || value === null) {
    return value;
  }

  return null;
}
