import { Injectable } from '@angular/core';

import { parseArchiveIndex } from '../core/github/archive-index';
import { ArchiveIndexFile } from '../core/github/archive-index.interface';
import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { jsDelivrFileUrl } from '../core/github/jsdelivr';
import { INDEX_JSON_PATH } from '../core/github/protocols-repo.constant';
import { ARCHIVE_INDEX_LOAD_ERROR_PREFIX } from './archive.service.constant';

/**
 * Reads the public archive index from the jsDelivr CDN. Only a 404/403 (jsDelivr answers both
 * for a file that has never been published) yields an empty index; any other non-OK response
 * or a network failure rejects, so the page can distinguish "no events" from "the list could
 * not be loaded".
 */
@Injectable({ providedIn: 'root' })
export class ArchiveService {
  async loadIndex(): Promise<ArchiveIndexFile> {
    const response = await fetch(jsDelivrFileUrl(INDEX_JSON_PATH));

    if (response.status === HTTP_NOT_FOUND || response.status === HTTP_FORBIDDEN) {
      return parseArchiveIndex(null);
    }

    if (!response.ok) {
      throw new Error(`${ARCHIVE_INDEX_LOAD_ERROR_PREFIX}${response.status}`);
    }

    return parseArchiveIndex(await response.text());
  }
}
