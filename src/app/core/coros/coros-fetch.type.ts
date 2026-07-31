/** Injectable fetch (matching the global fetch call shape), so specs never hit the network. */
export type CorosFetchFn = (url: string, init?: RequestInit) => Promise<Response>;
