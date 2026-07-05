import { GithubFetchFn } from './github-fetch.type';

/** Default fetch for production use; wraps the global fetch to keep its `this` binding intact. */
export const DEFAULT_GITHUB_FETCH: GithubFetchFn = (url, init) => fetch(url, init);
