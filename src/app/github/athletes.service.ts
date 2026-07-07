import { Injectable, inject } from '@angular/core';

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { parseAthletesHistory } from '../core/github/history-file';
import { jsDelivrFileUrl } from '../core/github/jsdelivr';
import { ATHLETES_JSON_PATH } from '../core/github/protocols-repo.constant';
import { computeOverallStats } from '../core/history/overall-stats';
import { OverallStats } from '../core/history/overall-stats.interface';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { AthletesHistory } from '../core/models/athletes-history.type';
import { ATHLETES_HISTORY_LOAD_ERROR_PREFIX } from './athletes.service.constant';
import { cdnFetchOptions } from './cdn-fetch';
import { CdnRefService } from './cdn-ref.service';
import { selectAthleteRecord, selectAthleteRecords, selectOverallStats } from './protocol-db-queries';
import { ProtocolDbService } from './protocol-db.service';

/**
 * Anonymous read of the public athletes history — the visitor-facing counterpart of the
 * admin-only `HistoryService` (which needs a fresh copy via the authorized Contents API).
 * The hot paths (`loadRecord`, `loadRecords`, `loadOverallStats`) query `protocol.db` over
 * HTTP range requests first and fall back to the whole `athletes.json` on ANY db failure —
 * range support on the CDN is not guaranteed, and prerender always takes the JSON path.
 * On the JSON path a 404/403 (jsDelivr answers both for a file that has never been published)
 * parses to an empty history; any other non-OK response or a network failure rejects. The
 * history is cached for the session: every fallback shares one fetch.
 */
@Injectable({ providedIn: 'root' })
export class AthletesService {
  readonly #cdnRef = inject(CdnRefService);
  readonly #db = inject(ProtocolDbService);

  #history: Promise<AthletesHistory> | null = null;

  /** A rejected load is evicted from the cache, so a reload can retry the fetch. */
  loadHistory(): Promise<AthletesHistory> {
    this.#history ??= this.#fetchHistory().catch((error: unknown) => {
      this.#history = null;
      throw error;
    });

    return this.#history;
  }

  /** One athlete for the athlete page: a few keyed selects instead of the whole history. */
  async loadRecord(key: string): Promise<AthleteRecord | null> {
    try {
      return await selectAthleteRecord(this.#db, key);
    } catch {
      return (await this.loadHistory())[key] ?? null;
    }
  }

  /** Every ranked athlete for the records page, already shaped for `bestResults`. */
  async loadRecords(): Promise<AthleteRecord[]> {
    try {
      return await selectAthleteRecords(this.#db);
    } catch {
      return Object.values(await this.loadHistory());
    }
  }

  /** The home page totals: SQL aggregates, or the same numbers computed over the full history. */
  async loadOverallStats(): Promise<OverallStats> {
    try {
      return await selectOverallStats(this.#db);
    } catch {
      return computeOverallStats(await this.loadHistory());
    }
  }

  async #fetchHistory(): Promise<AthletesHistory> {
    const ref = await this.#cdnRef.resolve();
    const response = await fetch(jsDelivrFileUrl(ATHLETES_JSON_PATH, ref), cdnFetchOptions(ref));

    if (response.status === HTTP_NOT_FOUND || response.status === HTTP_FORBIDDEN) {
      return parseAthletesHistory(null);
    }

    if (!response.ok) {
      throw new Error(`${ATHLETES_HISTORY_LOAD_ERROR_PREFIX}${response.status}`);
    }

    return parseAthletesHistory(await response.text());
  }
}
