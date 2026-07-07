import { Injectable, inject } from '@angular/core';

import { parseArchiveIndex } from '../core/github/archive-index';
import { ARCHIVE_INDEX_SCHEMA_VERSION } from '../core/github/archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from '../core/github/archive-index.interface';
import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { jsDelivrFileUrl } from '../core/github/jsdelivr';
import { INDEX_JSON_PATH } from '../core/github/protocols-repo.constant';
import { ARCHIVE_INDEX_LOAD_ERROR_PREFIX } from './archive.service.constant';
import { cdnFetchOptions } from './cdn-fetch';
import { CdnRefService } from './cdn-ref.service';
import { selectArchiveEvents } from './protocol-db-queries';
import { ProtocolDbService } from './protocol-db.service';

/**
 * Reads the public event archive: `protocol.db` over HTTP range requests first, the whole
 * `index.json` on ANY db failure — range support on the CDN is not guaranteed, and prerender
 * always takes the JSON path. On the JSON path only a 404/403 (jsDelivr answers both for a
 * file that has never been published) yields an empty index; any other non-OK response or a
 * network failure rejects, so the page can distinguish "no events" from "the list could not
 * be loaded".
 */
@Injectable({ providedIn: 'root' })
export class ArchiveService {
  readonly #cdnRef = inject(CdnRefService);
  readonly #db = inject(ProtocolDbService);

  async loadIndex(): Promise<ArchiveIndexFile> {
    try {
      return { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: await selectArchiveEvents(this.#db) };
    } catch {
      return this.#fetchIndex();
    }
  }

  /** The newest `count` events for the home preview: `LIMIT` in SQL, a slice of the index on fallback. */
  async loadLatest(count: number): Promise<ArchiveIndexEntry[]> {
    try {
      return await selectArchiveEvents(this.#db, count);
    } catch {
      return (await this.#fetchIndex()).events.slice(0, count);
    }
  }

  async #fetchIndex(): Promise<ArchiveIndexFile> {
    const ref = await this.#cdnRef.resolve();
    const response = await fetch(jsDelivrFileUrl(INDEX_JSON_PATH, ref), cdnFetchOptions(ref));

    if (response.status === HTTP_NOT_FOUND || response.status === HTTP_FORBIDDEN) {
      return parseArchiveIndex(null);
    }

    if (!response.ok) {
      throw new Error(`${ARCHIVE_INDEX_LOAD_ERROR_PREFIX}${response.status}`);
    }

    return parseArchiveIndex(await response.text());
  }
}
