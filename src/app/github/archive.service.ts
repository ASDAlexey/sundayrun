import { Injectable, inject } from '@angular/core';

import { createQueryCache } from '../core/cache/query-cache';
import { ARCHIVE_INDEX_SCHEMA_VERSION } from '../core/github/archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from '../core/github/archive-index.interface';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { selectArchiveEvents } from './protocol-db-queries';
import { PROTOCOL_DB } from './protocol-db.token';

/**
 * Reads the public event archive from `sundayrun.db` over HTTP range requests — the only source now
 * that the JSON mirror is gone. The db service retries a transient range failure; a persistent one
 * rejects, so the page shows its error state with a reload. An empty archive is simply the db
 * returning no rows, which stays distinct from a load failure.
 */
@Injectable({ providedIn: 'root' })
export class ArchiveService {
  readonly #db = createProtocolDrizzle(inject(PROTOCOL_DB));
  // Session memo: the full index is the races list's whole payload, re-read on every soft return.
  readonly #cache = createQueryCache();

  loadIndex(): Promise<ArchiveIndexFile> {
    return this.#cache('index', async () => ({
      schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION,
      events: await selectArchiveEvents(this.#db),
    }));
  }

  /** The newest `count` events for the home preview: `LIMIT` in SQL. */
  loadLatest(count: number): Promise<ArchiveIndexEntry[]> {
    return this.#cache(`latest:${count}`, () => selectArchiveEvents(this.#db, count));
  }
}
