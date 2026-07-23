import { GithubFetchFn } from './github-fetch.type';

/**
 * The default cache mode is load-bearing: api.github.com answers authenticated GETs with
 * `max-age=60`, so a cached head-ref read poisons every retry of `commitFilesAtomically` with the
 * same stale parent sha — the ref update then 422s until the cache expires, misreporting a publish
 * as failed.
 */
export const GITHUB_FETCH_CACHE_MODE: RequestCache = 'no-store';

/**
 * Default fetch for production use; wraps the global fetch to keep its `this` binding intact.
 * The cache mode is a default, not an override — a caller passing its own `cache` (the version
 * pointer's `no-cache` revalidate) keeps it.
 */
export const DEFAULT_GITHUB_FETCH: GithubFetchFn = (url, init) => fetch(url, { cache: GITHUB_FETCH_CACHE_MODE, ...init });
