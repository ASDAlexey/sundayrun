import { Injectable, inject } from '@angular/core';

import { EventResultsFile } from '../core/github/results-file.interface';
import { ParticipantRun } from '../core/history/notables.interface';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { selectEventParticipantRuns, selectEventResults } from './protocol-db-queries';
import { PROTOCOL_DB } from './protocol-db.token';

/**
 * Anonymous read of one event's protocol from `sundayrun.db` over HTTP range requests — the only
 * source now that the JSON mirror is gone. An unknown slug resolves to null ("no such protocol");
 * the db service retries a transient range failure, and a persistent one rejects so the page can
 * distinguish "not found" from "could not be loaded". Loads are cached per slug for the session.
 */
@Injectable({ providedIn: 'root' })
export class ResultsService {
  readonly #db = createProtocolDrizzle(inject(PROTOCOL_DB));
  readonly #results = new Map<string, Promise<EventResultsFile | null>>();

  /**
   * A rejected load is evicted from the cache, so a reload can retry it. A null result ("not found")
   * is evicted too: a protocol published later in the session must become visible.
   */
  loadResults(slug: string): Promise<EventResultsFile | null> {
    const cached = this.#results.get(slug);

    if (cached !== undefined) {
      return cached;
    }

    const pending = selectEventResults(this.#db, slug).then(
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

  /** Every 5 km run of the event's finishers, feeding the protocol page's on-the-fly notables. */
  loadParticipantRuns(slug: string): Promise<ParticipantRun[]> {
    return selectEventParticipantRuns(this.#db, slug);
  }
}
