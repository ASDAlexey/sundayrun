import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, Signal, inject, signal } from '@angular/core';

import { environment } from '../../environments/environment';
import { pinnedProtocolDbPath } from '../core/github/protocol-db-path';
import { VERSION_JSON_PATH } from '../core/github/protocols-repo.constant';
import { rawGithubFileUrl } from '../core/github/raw-github';
import { parseVersionSha } from '../core/github/version-file';
import { COMMIT_SHA_PATTERN } from '../core/github/version-file.constant';
import { DbSource } from '../core/sqlite/db-source.enum';
import { CdnRefService } from './cdn-ref.service';
import { DbFreshness, DbFreshnessType } from './db-freshness.enum';
import {
  DB_FRESHNESS_POLL_ATTEMPTS,
  DB_FRESHNESS_POLL_INTERVAL_MS,
  DB_FRESHNESS_PROBE_OPTIONS,
  FRESH_POINTER_FETCH_OPTIONS,
  FRESH_POINTER_QUERY_PARAM,
} from './db-freshness.service.constant';

/**
 * Watches whether the deploy carrying the published data commit's db has landed. `version.json`
 * moves the instant a publication is purged, but the sha-named db copy (see `pinnedProtocolDbPath`)
 * appears only when the Pages deploy finishes ~3–5 minutes later — until then its url is a plain
 * 404, which is the one unambiguous "data is still old" signal this host offers. While the probe
 * misses, `ProtocolDbService` reads the plain-named fallback (the previous data, fully usable) and
 * the shell banner tells visitors fresh results are minutes away; a background poll flips the
 * banner to a reload offer once the file appears. Probes run in the browser against the Pages
 * source only — the dev server's on-disk db is always current.
 *
 * The session's ref comes from the raw `version.json`, which can lag a publication by up to five
 * minutes — long enough for a fresh tab to miss the whole deploy. So a Fresh verdict gets a second
 * opinion: the pointer is re-read with a cache-busting query, and a newer sha found there drives
 * the same Updating → Updated flow (and is remembered for the reload via `CdnRefService`).
 */
@Injectable({ providedIn: 'root' })
export class DbFreshnessService {
  readonly #cdnRef = inject(CdnRefService);
  readonly #document = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #state = signal<DbFreshnessType>(DbFreshness.Fresh);

  readonly state: Signal<DbFreshnessType> = this.#state.asReadonly();

  #availableRef = '';
  #available: Promise<boolean> | null = null;

  /** The ref the active poll watches; re-pointing it (or nulling) stops a superseded poll. */
  #watchRef: string | null = null;

  /** The shell banner's fire-and-forget hook: probe the session's ref even on pages that never query. */
  check(): void {
    if (!this.#isBrowser || environment.dbSource !== DbSource.Pages) {
      return;
    }

    void this.#cdnRef.resolve().then((ref) => this.pinnedDbAvailable(ref));
  }

  /** Whether `data/sundayrun-<ref>.db` is already served — memoized per ref, like the db pool. */
  pinnedDbAvailable(ref: string): Promise<boolean> {
    if (this.#available === null || this.#availableRef !== ref) {
      this.#availableRef = ref;
      this.#available = this.#probe(ref);
    }

    return this.#available;
  }

  /** Only a plain 404 means "deploy in flight"; the branch fallback ref names no bundled file at all. */
  async #probe(ref: string): Promise<boolean> {
    if (!COMMIT_SHA_PATTERN.test(ref)) {
      return false;
    }

    const exists = await this.#exists(ref);

    if (exists === true) {
      // Also heals a stale banner: a re-pinned ref that is already served supersedes its poll.
      this.#watchRef = null;
      this.#state.set(DbFreshness.Fresh);
      void this.#verifyPointerFresh(ref);
    } else if (exists === false) {
      this.#state.set(DbFreshness.Updating);
      this.#watchRef = ref;
      this.#poll(ref, DB_FRESHNESS_POLL_ATTEMPTS);
    }

    return exists ?? false;
  }

  /**
   * The second opinion behind a Fresh verdict: the session's ref may be a stale pointer read, so
   * the pointer is re-fetched past every cache. A newer sha whose db is missing means a deploy is
   * in flight right now — the banner and poll cover it; one already served means the session
   * simply reads old data — the reload offer shows. Either way the sha is remembered, so the
   * session after the reload resolves it directly instead of the stale raw read.
   */
  async #verifyPointerFresh(sessionRef: string): Promise<void> {
    const freshSha = await this.#fetchFreshPointerSha();

    if (freshSha === null || freshSha === sessionRef) {
      return;
    }

    this.#cdnRef.noteFreshSha(freshSha);
    const exists = await this.#exists(freshSha);

    if (exists === false) {
      this.#state.set(DbFreshness.Updating);
      this.#watchRef = freshSha;
      this.#poll(freshSha, DB_FRESHNESS_POLL_ATTEMPTS);
    } else if (exists === true) {
      this.#state.set(DbFreshness.Updated);
    }
  }

  /** The pointer past every cache: raw keys its CDN cache by the full url, so a unique query busts it. */
  async #fetchFreshPointerSha(): Promise<string | null> {
    try {
      const url = `${rawGithubFileUrl(VERSION_JSON_PATH)}?${FRESH_POINTER_QUERY_PARAM}=${Date.now()}`;
      const response = await fetch(url, FRESH_POINTER_FETCH_OPTIONS);

      return response.ok ? parseVersionSha(await response.text()) : null;
    } catch {
      return null;
    }
  }

  /** `null` is a network failure: the fallback url is still the safe answer, but no banner or poll. */
  async #exists(ref: string): Promise<boolean | null> {
    try {
      const response = await fetch(new URL(pinnedProtocolDbPath(ref), this.#document.baseURI).href, DB_FRESHNESS_PROBE_OPTIONS);

      return response.ok;
    } catch {
      return null;
    }
  }

  /** A mid-poll `pin` re-points the session (see `pinnedDbAvailable`), so a superseded poll stops. */
  #poll(ref: string, attemptsLeft: number): void {
    if (attemptsLeft <= 0) {
      // The deploy is long overdue — hide the promise of fresh data instead of keeping it forever.
      this.#watchRef = null;
      this.#state.set(DbFreshness.Fresh);

      return;
    }

    setTimeout(() => {
      if (this.#watchRef !== ref) {
        return;
      }

      void this.#exists(ref).then((exists) => {
        if (exists === true) {
          // The landed file also refreshes the availability memo, so a client-side navigation
          // (e.g. «Показать результаты») opens the fresh pinned db without a full reload; the
          // remembered sha spares the session after a reload the stale raw pointer read.
          if (this.#availableRef === ref) {
            this.#available = Promise.resolve(true);
          }

          this.#cdnRef.noteFreshSha(ref);
          this.#watchRef = null;
          this.#state.set(DbFreshness.Updated);
        } else {
          this.#poll(ref, attemptsLeft - 1);
        }
      });
    }, DB_FRESHNESS_POLL_INTERVAL_MS);
  }
}
