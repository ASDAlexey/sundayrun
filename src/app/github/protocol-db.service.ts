import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, PLATFORM_ID, Service, inject } from '@angular/core';

import type { Database } from '@sqlite.org/sqlite-wasm';

import { environment } from '../../environments/environment';
import { pinnedProtocolDbPath } from '../core/github/protocol-db-path';
import { PROTOCOL_DB_PATH } from '../core/github/protocols-repo.constant';
import { DbSource } from '../core/sqlite/db-source.enum';
import { deserializeDbInto } from '../core/sqlite/deserialize-db';
import { ProtocolDbValue } from '../core/sqlite/protocol-db-value.type';
import { loadSqlite3 } from '../core/sqlite/sqlite-loader';
import { CdnRefService } from './cdn-ref.service';
import { DbFreshnessService } from './db-freshness.service';
import { narrowValues } from '../core/sqlite/protocol-db-narrow';
import {
  PROTOCOL_DB_BROWSER_ONLY_ERROR,
  PROTOCOL_DB_FETCH_ERROR_PREFIX,
  PROTOCOL_DB_LOCAL_DB_REF,
  PROTOCOL_DB_QUERY_ATTEMPTS,
} from './protocol-db.service.constant';

/**
 * A SQLite connection to `data/sundayrun.db`, held in memory for the session: the file is fetched
 * whole, once, and handed to the wasm engine with `sqlite3_deserialize`. Every statement after that
 * runs against RAM.
 *
 * It used to be a range-reading VFS (`sqlite-wasm-http`) that fetched only the pages a statement
 * touched — the right shape when the db is large and every query is keyed. This one is neither. The
 * whole archive is 1.2 MB (261 KB gzipped) while the range VFS alone cost 3.4 MB of unoptimized wasm
 * (1.7 MB gzipped) plus half a megabyte of workers, and the client-rendered routes issue a dozen
 * archive-wide queries whose full scans became hundreds of sequential 4 KB round-trips — one worker,
 * one page per request, and a `max-age=600` that makes the second visit pay again. Fetching the
 * whole file costs two requests and a quarter of the bytes.
 *
 * The db is read same-origin — the copy bundled into the GitHub Pages deploy in production, or the
 * dev server's on-disk copy in local development (which skips the CDN ref lookup entirely). Any
 * failure — the wasm module, the download, the statement itself — is retried once over a fresh
 * connection and then rejects into the caller's error state; there is no JSON mirror left to fall
 * back to. During prerender `queryValues` rejects before touching the wasm module, keeping the
 * static build clean.
 *
 * Cache freshness rides on the file *name*: the deploy bundles a copy named by the data commit (see
 * `pinnedProtocolDbPath`), and the plain name is the fallback read while `DbFreshnessService`
 * reports that copy's deploy still in flight.
 */
@Service()
export class ProtocolDbService {
  readonly #cdnRef = inject(CdnRefService);
  readonly #freshness = inject(DbFreshnessService);
  readonly #document = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  #connectionUrl = '';
  #connection: Promise<Database> | null = null;

  /** Rows as positional value arrays for the columns of `sql`, narrowed to the db's value kinds. */
  async queryValues(sql: string, params: readonly ProtocolDbValue[]): Promise<ProtocolDbValue[][]> {
    if (!this.#isBrowser) {
      throw new Error(PROTOCOL_DB_BROWSER_ONLY_ERROR);
    }

    return this.#queryWithRetry(sql, params, PROTOCOL_DB_QUERY_ATTEMPTS);
  }

  /**
   * A failed attempt evicts the half-made connection (see `#connectionFor`), so the retry downloads
   * and deserializes from scratch — enough to ride out one transient network failure now that no
   * JSON fallback follows.
   */
  async #queryWithRetry(sql: string, params: readonly ProtocolDbValue[], attemptsLeft: number): Promise<ProtocolDbValue[][]> {
    try {
      const db = await this.#connectionFor(await this.#resolveRef());

      return db.exec(sql, { bind: [...params], rowMode: 'array', returnValue: 'resultRows' }).map(narrowValues);
    } catch (error) {
      if (attemptsLeft <= 1) {
        throw error;
      }

      return this.#queryWithRetry(sql, params, attemptsLeft - 1);
    }
  }

  /**
   * One connection per db url, cached for the session: a `pin` after a publication swaps in the new
   * sha, and the url flipping from the plain fallback to the sha copy (the moment the deploy lands)
   * re-downloads the fresh file — both let the superseded connection close in the background. A
   * failed open is evicted from the cache, so a later query can retry it.
   */
  async #connectionFor(ref: string): Promise<Database> {
    const url = await this.#dbUrl(ref);

    if (this.#connection === null || this.#connectionUrl !== url) {
      void this.#connection?.then((db) => db.close()).catch(() => undefined);
      this.#connectionUrl = url;
      this.#connection = this.#open(url).catch((error: unknown) => {
        this.#connection = null;
        throw error;
      });
    }

    return this.#connection;
  }

  /** Local reads a fixed on-disk url, so it needs no sha; Pages uses the data sha as a cache-buster. */
  #resolveRef(): Promise<string> {
    return environment.dbSource === DbSource.Local ? Promise.resolve(PROTOCOL_DB_LOCAL_DB_REF) : this.#cdnRef.resolve();
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

  /**
   * The download and the wasm module are fetched in parallel: neither needs the other, and on a cold
   * visit they are the only two things standing between the page and its data. The dynamic import
   * inside `loadSqlite3` keeps every wasm byte out of the initial bundle and out of the prerender.
   */
  async #open(url: string): Promise<Database> {
    const [sqlite3, dbBytes] = await Promise.all([loadSqlite3(), this.#fetchDb(url)]);
    const db = new sqlite3.oo1.DB();

    try {
      deserializeDbInto(sqlite3, db, dbBytes);
    } catch (error) {
      db.close();
      throw error;
    }

    return db;
  }

  async #fetchDb(url: string): Promise<Uint8Array> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${PROTOCOL_DB_FETCH_ERROR_PREFIX}${response.status}`);
    }

    return new Uint8Array(await response.arrayBuffer());
  }
}
