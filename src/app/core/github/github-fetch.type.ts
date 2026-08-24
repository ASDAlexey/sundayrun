/** Injectable fetch (matching the global fetch call shape), so specs never hit the network. */
export type GithubFetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * The authorized transport a GitHub call runs on. Token and fetch always travel together, so they
 * are passed as one value rather than as two positional arguments threaded through every helper.
 */
export interface GithubAccess {
  readonly token: string;
  readonly fetchFn: GithubFetchFn;
}
