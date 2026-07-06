import { Injectable } from '@angular/core';

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { parseAthletesHistory } from '../core/github/history-file';
import { jsDelivrFileUrl } from '../core/github/jsdelivr';
import { ATHLETES_JSON_PATH } from '../core/github/protocols-repo.constant';
import { AthletesHistory } from '../core/models/athletes-history.type';
import { ATHLETES_HISTORY_LOAD_ERROR_PREFIX } from './athletes.service.constant';
import { CDN_REVALIDATE_FETCH_OPTIONS } from './cdn-fetch.constant';

/**
 * Anonymous read of the public athletes history (`athletes.json`) from the jsDelivr CDN — the
 * visitor-facing counterpart of the admin-only `HistoryService` (which needs a fresh copy via
 * the authorized Contents API). A 404/403 (jsDelivr answers both for a file that has never
 * been published) parses to an empty history; any other non-OK response or a network failure
 * rejects. The result is cached for the session: both athlete pages share one fetch.
 */
@Injectable({ providedIn: 'root' })
export class AthletesService {
  #history: Promise<AthletesHistory> | null = null;

  /** A rejected load is evicted from the cache, so a reload can retry the fetch. */
  loadHistory(): Promise<AthletesHistory> {
    this.#history ??= this.#fetchHistory().catch((error: unknown) => {
      this.#history = null;
      throw error;
    });

    return this.#history;
  }

  async #fetchHistory(): Promise<AthletesHistory> {
    const response = await fetch(jsDelivrFileUrl(ATHLETES_JSON_PATH), CDN_REVALIDATE_FETCH_OPTIONS);

    if (response.status === HTTP_NOT_FOUND || response.status === HTTP_FORBIDDEN) {
      return parseAthletesHistory(null);
    }

    if (!response.ok) {
      throw new Error(`${ATHLETES_HISTORY_LOAD_ERROR_PREFIX}${response.status}`);
    }

    return parseAthletesHistory(await response.text());
  }
}
