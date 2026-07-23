import { GithubFetchFn } from './github-fetch.type';

/**
 * Default fetch for production use; wraps the global fetch to keep its `this` binding intact.
 * `no-store` is load-bearing: api.github.com answers authenticated GETs with `max-age=60`, so a
 * cached head-ref read poisons every retry of `commitFilesAtomically` with the same stale parent
 * sha — the ref update then 422s until the cache expires, misreporting a publish as failed.
 */
export const DEFAULT_GITHUB_FETCH: GithubFetchFn = (url, init) => fetch(url, { ...init, cache: 'no-store' });
