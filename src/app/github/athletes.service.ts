import { Injectable, inject } from '@angular/core';

import { OverallStats } from '../core/history/overall-stats.interface';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { selectAthleteRecord, selectAthleteRecords, selectOverallStats } from './protocol-db-queries';
import { PROTOCOL_DB } from './protocol-db.token';

/**
 * Anonymous read of the public athletes history from `protocol.db` over HTTP range requests — the
 * visitor-facing counterpart of the admin-only `HistoryService` (which needs a fresh copy via the
 * authorized Contents API). `loadRecord`/`loadRecords`/`loadOverallStats` run keyed selects or SQL
 * aggregates; the db service retries a transient range failure, and a persistent one rejects so the
 * page shows its error state with a reload. There is no JSON mirror to fall back to.
 */
@Injectable({ providedIn: 'root' })
export class AthletesService {
  readonly #db = createProtocolDrizzle(inject(PROTOCOL_DB));

  /** One athlete for the athlete page: a few keyed selects. */
  loadRecord(key: string): Promise<AthleteRecord | null> {
    return selectAthleteRecord(this.#db, key);
  }

  /** Every ranked athlete for the records page, already shaped for `bestResults`. */
  loadRecords(): Promise<AthleteRecord[]> {
    return selectAthleteRecords(this.#db);
  }

  /** The home page totals as SQL aggregates. */
  loadOverallStats(): Promise<OverallStats> {
    return selectOverallStats(this.#db);
  }
}
