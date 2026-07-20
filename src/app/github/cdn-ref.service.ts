import { Injectable } from '@angular/core';

import { fetchBranchHeadSha } from '../core/github/branch-head';
import { DEFAULT_GITHUB_FETCH } from '../core/github/github-fetch.constant';
import { PROTOCOLS_REPO_BRANCH, VERSION_JSON_PATH } from '../core/github/protocols-repo.constant';
import { rawGithubFileUrl } from '../core/github/raw-github';
import { parseVersionSha } from '../core/github/version-file';
import { CDN_REVALIDATE_FETCH_OPTIONS } from './cdn-fetch.constant';

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
 * immediately.
 */
@Injectable({ providedIn: 'root' })
export class CdnRefService {
  #ref: Promise<string> | null = null;

  resolve(): Promise<string> {
    this.#ref ??= resolveRef();

    return this.#ref;
  }

  /** Pins subsequent reads to a commit this session just created. */
  pin(commitSha: string): void {
    this.#ref = Promise.resolve(commitSha);
  }
}

/** The `version.json` pointer first, then the GitHub API branch head, then the literal branch ref. */
async function resolveRef(): Promise<string> {
  return (await fetchVersionPointerSha()) ?? fetchBranchHeadSha().catch(() => PROTOCOLS_REPO_BRANCH);
}

/** Reads the pointer from its raw branch url; any failure or implausible sha yields null. */
async function fetchVersionPointerSha(): Promise<string | null> {
  try {
    const response = await DEFAULT_GITHUB_FETCH(rawGithubFileUrl(VERSION_JSON_PATH), CDN_REVALIDATE_FETCH_OPTIONS);

    return response.ok ? parseVersionSha(await response.text()) : null;
  } catch {
    return null;
  }
}
