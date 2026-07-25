import { Injectable, inject } from '@angular/core';

import { GithubAuthError } from '../core/github/github-errors';
import { PROTOCOL_DB_PATH } from '../core/github/protocols-repo.constant';
import { fetchRepoFileBytes } from '../core/github/repo-contents';
import { readHistoryFromDb } from '../core/sqlite/protocol-db-read';
import { AthletesHistory } from '../core/models/athletes-history.type';
import { AdminTokenService } from './admin-token.service';
import { HISTORY_MISSING_TOKEN_MESSAGE } from './history.service.constant';

/**
 * Reads the accumulated athletes history out of `sundayrun.db` for the admin import. Goes through the
 * authorized Contents API rather than the public read path: the deploy-bundled db only carries the
 * data the last deploy shipped, so a back-to-back import of old events would keep computing notes
 * against a stale copy. The whole file is downloaded and reassembled in memory instead.
 */
@Injectable({ providedIn: 'root' })
export class HistoryService {
  readonly #adminToken = inject(AdminTokenService);

  /** A missing db parses to an empty history; a missing token maps to `GithubAuthError`. */
  async loadHistory(): Promise<AthletesHistory> {
    const token = this.#adminToken.token();

    if (token === null) {
      throw new GithubAuthError(HISTORY_MISSING_TOKEN_MESSAGE);
    }

    const dbBytes = await fetchRepoFileBytes(token, PROTOCOL_DB_PATH);

    return dbBytes === null ? {} : readHistoryFromDb(dbBytes);
  }
}
