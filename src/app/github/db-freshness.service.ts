import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, Signal, inject, signal } from '@angular/core';

import { environment } from '../../environments/environment';
import { pinnedProtocolDbPath } from '../core/github/protocol-db-path';
import { COMMIT_SHA_PATTERN } from '../core/github/version-file.constant';
import { DbSource } from '../core/sqlite/db-source.enum';
import { CdnRefService } from './cdn-ref.service';
import { DbFreshness, DbFreshnessType } from './db-freshness.enum';
import { DB_FRESHNESS_POLL_ATTEMPTS, DB_FRESHNESS_POLL_INTERVAL_MS, DB_FRESHNESS_PROBE_OPTIONS } from './db-freshness.service.constant';

/**
 * Watches whether the deploy carrying the published data commit's db has landed. `version.json`
 * moves the instant a publication is purged, but the sha-named db copy (see `pinnedProtocolDbPath`)
 * appears only when the Pages deploy finishes ~3–5 minutes later — until then its url is a plain
 * 404, which is the one unambiguous "data is still old" signal this host offers. While the probe
 * misses, `ProtocolDbService` reads the plain-named fallback (the previous data, fully usable) and
 * the shell banner tells visitors fresh results are minutes away; a background poll flips the
 * banner to a reload offer once the file appears. Probes run in the browser against the Pages
 * source only — the dev server's on-disk db is always current.
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
      this.#state.set(DbFreshness.Fresh);
    } else if (exists === false) {
      this.#state.set(DbFreshness.Updating);
      this.#poll(ref, DB_FRESHNESS_POLL_ATTEMPTS);
    }

    return exists ?? false;
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
      this.#state.set(DbFreshness.Fresh);

      return;
    }

    setTimeout(() => {
      if (this.#availableRef !== ref) {
        return;
      }

      void this.#exists(ref).then((exists) => {
        if (exists === true) {
          this.#state.set(DbFreshness.Updated);
        } else {
          this.#poll(ref, attemptsLeft - 1);
        }
      });
    }, DB_FRESHNESS_POLL_INTERVAL_MS);
  }
}
