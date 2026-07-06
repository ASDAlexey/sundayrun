import { Injectable } from '@angular/core';

import { fetchBranchHeadSha } from '../core/github/branch-head';
import { PROTOCOLS_REPO_BRANCH } from '../core/github/protocols-repo.constant';

/**
 * Resolves the jsDelivr ref all public data reads are pinned to. Branch (`@main`) urls are
 * cached by the CDN for up to a week and purges are throttled, so they may stay stale long
 * after a publication. Instead the branch head sha is read once per session from the GitHub
 * API (never cached) and every data url is pinned to it — a sha url is immutable, so the CDN
 * can never serve it stale. A failed lookup falls back to the branch ref for the rest of the
 * session, restoring the pre-pinning behaviour. After an admin publication or deletion `pin`
 * swaps in the just-created commit, so the session sees its own write immediately.
 */
@Injectable({ providedIn: 'root' })
export class CdnRefService {
  #ref: Promise<string> | null = null;

  resolve(): Promise<string> {
    this.#ref ??= fetchBranchHeadSha().catch(() => PROTOCOLS_REPO_BRANCH);

    return this.#ref;
  }

  /** Pins subsequent reads to a commit this session just created. */
  pin(commitSha: string): void {
    this.#ref = Promise.resolve(commitSha);
  }
}
