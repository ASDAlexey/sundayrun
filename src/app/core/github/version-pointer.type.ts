/** Awaitable delay, injected so specs can make the pointer-commit backoff instant. */
export type SleepFn = (ms: number) => Promise<void>;
