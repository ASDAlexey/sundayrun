import { Injectable, inject } from '@angular/core';

import { ARCHIVE_INDEX_SCHEMA_VERSION } from '../core/github/archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from '../core/github/archive-index.interface';
import { selectArchiveEvents } from './protocol-db-queries';
import { PROTOCOL_DB } from './protocol-db.token';

/**
 * Reads the public event archive from `protocol.db` over HTTP range requests — the only source now
 * that the JSON mirror is gone. The db service retries a transient range failure; a persistent one
 * rejects, so the page shows its error state with a reload. An empty archive is simply the db
 * returning no rows, which stays distinct from a load failure.
 */
@Injectable({ providedIn: 'root' })
export class ArchiveService {
  readonly #db = inject(PROTOCOL_DB);

  async loadIndex(): Promise<ArchiveIndexFile> {
    return { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: await selectArchiveEvents(this.#db) };
  }

  /** The newest `count` events for the home preview: `LIMIT` in SQL. */
  loadLatest(count: number): Promise<ArchiveIndexEntry[]> {
    return selectArchiveEvents(this.#db, count);
  }
}
