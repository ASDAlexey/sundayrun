/** Injectable fetch (matching the global fetch call shape), so specs never hit the network. */
export type WeatherFetchFn = (url: string) => Promise<Response>;
