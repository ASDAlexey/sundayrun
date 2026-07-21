import { DOCUMENT, Injectable, inject } from '@angular/core';

import { fetchBranchHeadSha } from '../core/github/branch-head';
import { DEFAULT_GITHUB_FETCH } from '../core/github/github-fetch.constant';
import { PROTOCOLS_REPO_BRANCH, VERSION_JSON_PATH } from '../core/github/protocols-repo.constant';
import { rawGithubFileUrl } from '../core/github/raw-github';
import { safeJsonParse } from '../core/github/safe-json-parse';
import { parseVersionSha } from '../core/github/version-file';
import { COMMIT_SHA_PATTERN } from '../core/github/version-file.constant';
import { CDN_REVALIDATE_FETCH_OPTIONS } from './cdn-fetch.constant';
import { FRESH_SHA_STORAGE_KEY, FRESH_SHA_TTL_MS } from './cdn-ref.service.constant';

/**
 * Resolves the ref all public data reads are pinned to. Branch (`@main`) CDN urls are cached
 * for up to a week and may stay stale long after a publication. Instead the `version.json`
 * pointer — the only file read via a branch url, revalidated on every session — names the data
 * commit, and every data url is pinned to it: a sha url is immutable, so the CDN can never
 * serve it stale. The pointer is read from raw.githubusercontent (a hard five-minute cache
 * bound), not jsDelivr, whose origin was observed serving a stale pointer even after a
 * successful purge. When the pointer is unreachable or implausible the branch head sha is read
 * from the GitHub API (never cached); a failed lookup falls back to the branch ref for the
 * rest of the session, restoring the pre-pinning behaviour. After an admin publication or
 * deletion `pin` swaps in the just-created commit, so the session sees its own write
 * immediately. A sha the freshness check discovered past raw's cache (see `noteFreshSha`) is
 * kept in sessionStorage and wins for a few minutes — the session after the banner's reload
 * must not fall back to the very raw read whose staleness triggered the banner.
 */
@Injectable({ providedIn: 'root' })
export class CdnRefService {
  readonly #storage = inject(DOCUMENT).defaultView?.sessionStorage ?? null;

  #ref: Promise<string> | null = null;

  resolve(): Promise<string> {
    this.#ref ??= this.#resolveRef();

    return this.#ref;
  }

  /** Pins subsequent reads to a commit this session just created. */
  pin(commitSha: string): void {
    this.#ref = Promise.resolve(commitSha);
  }

  /** Remembers a pointer sha read past raw's cache, so this tab's next session starts from it. */
  noteFreshSha(sha: string): void {
    try {
      this.#storage?.setItem(FRESH_SHA_STORAGE_KEY, JSON.stringify({ sha, atMs: Date.now() }));
    } catch {
      // Quota or privacy mode — the override is best-effort; raw heals within five minutes anyway.
    }
  }

  /** The remembered fresh sha first, then the pointer, then the API branch head, then the branch ref. */
  async #resolveRef(): Promise<string> {
    return this.#storedFreshSha() ?? (await fetchVersionPointerSha()) ?? fetchBranchHeadSha().catch(() => PROTOCOLS_REPO_BRANCH);
  }

  /** A plausible, still-young remembered sha; anything else (or an unreadable storage) yields null. */
  #storedFreshSha(): string | null {
    try {
      const parsed = safeJsonParse(this.#storage?.getItem(FRESH_SHA_STORAGE_KEY) ?? null);

      if (!isStoredFreshSha(parsed) || Date.now() - parsed.atMs > FRESH_SHA_TTL_MS) {
        return null;
      }

      return COMMIT_SHA_PATTERN.test(parsed.sha) ? parsed.sha : null;
    } catch {
      return null;
    }
  }
}

function isStoredFreshSha(value: unknown): value is { sha: string; atMs: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sha' in value &&
    typeof value.sha === 'string' &&
    'atMs' in value &&
    typeof value.atMs === 'number'
  );
}

/** The `version.json` pointer first, then the GitHub API branch head, then the literal branch ref. */
async function fetchVersionPointerSha(): Promise<string | null> {
  try {
    const response = await DEFAULT_GITHUB_FETCH(rawGithubFileUrl(VERSION_JSON_PATH), CDN_REVALIDATE_FETCH_OPTIONS);

    return response.ok ? parseVersionSha(await response.text()) : null;
  } catch {
    return null;
  }
}
