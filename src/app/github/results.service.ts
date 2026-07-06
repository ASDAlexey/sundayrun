import { Injectable, inject } from '@angular/core';

import { eventFilePaths } from '../core/github/event-paths';
import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { jsDelivrFileUrl } from '../core/github/jsdelivr';
import { parseEventResultsFile } from '../core/github/results-file';
import { EventResultsFile } from '../core/github/results-file.interface';
import { cdnFetchOptions } from './cdn-fetch';
import { CdnRefService } from './cdn-ref.service';
import { RESULTS_LOAD_ERROR_PREFIX } from './results.service.constant';

/**
 * Anonymous read of one event's `results.json` from the jsDelivr CDN. A 404/403 (jsDelivr
 * answers both for a file that has never been published) and an unparsable payload resolve
 * to null ("no such protocol"); any other non-OK response or a network failure rejects, so
 * the page can distinguish "not found" from "could not be loaded". Loads are cached per
 * slug for the session.
 */
@Injectable({ providedIn: 'root' })
export class ResultsService {
  readonly #cdnRef = inject(CdnRefService);
  readonly #results = new Map<string, Promise<EventResultsFile | null>>();

  /**
   * A rejected load is evicted from the cache, so a reload can retry the fetch. A null result
   * ("not found") is evicted too: a protocol published later in the session must become visible.
   */
  loadResults(slug: string): Promise<EventResultsFile | null> {
    const cached = this.#results.get(slug);

    if (cached !== undefined) {
      return cached;
    }

    const pending = this.#fetchResults(slug).then(
      (file) => {
        if (file === null) {
          this.#results.delete(slug);
        }

        return file;
      },
      (error: unknown) => {
        this.#results.delete(slug);
        throw error;
      },
    );

    this.#results.set(slug, pending);

    return pending;
  }

  async #fetchResults(slug: string): Promise<EventResultsFile | null> {
    const ref = await this.#cdnRef.resolve();
    const response = await fetch(jsDelivrFileUrl(eventFilePaths(slug).resultsJson, ref), cdnFetchOptions(ref));

    if (response.status === HTTP_NOT_FOUND || response.status === HTTP_FORBIDDEN) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`${RESULTS_LOAD_ERROR_PREFIX}${response.status}`);
    }

    return parseEventResultsFile(await response.text());
  }
}
