import { Injectable, inject } from '@angular/core';

import { GithubAuthError } from '../core/github/github-errors';
import { parseAthletesHistory } from '../core/github/history-file';
import { ATHLETES_JSON_PATH } from '../core/github/protocols-repo.constant';
import { fetchRepoFileText } from '../core/github/repo-contents';
import { AthletesHistory } from '../core/models/athletes-history.type';
import { AdminTokenService } from './admin-token.service';
import { HISTORY_MISSING_TOKEN_MESSAGE } from './history.service.constant';

/**
 * Reads the accumulated athletes history (`athletes.json`) from the protocols repository.
 * Goes through the authorized Contents API rather than jsDelivr: during a back-to-back import
 * of old events the CDN would keep serving a stale copy for up to its cache TTL.
 */
@Injectable({ providedIn: 'root' })
export class HistoryService {
  readonly #adminToken = inject(AdminTokenService);

  /** A missing file parses to an empty history; a missing token maps to `GithubAuthError`. */
  async loadHistory(): Promise<AthletesHistory> {
    const token = this.#adminToken.token();

    if (token === null) {
      throw new GithubAuthError(HISTORY_MISSING_TOKEN_MESSAGE);
    }

    return parseAthletesHistory(await fetchRepoFileText(token, ATHLETES_JSON_PATH));
  }
}
