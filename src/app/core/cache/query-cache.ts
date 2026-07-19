/** Replays a settled db read for the session; a fresh key runs `load` once and memoizes it. */
export type QueryCache = <T>(key: string, load: () => Promise<T>) => Promise<T>;

/**
 * A session-lifetime memo for the read services' db queries. The pinned db never changes while a
 * session runs — a fresh deploy makes the freshness banner reload the whole app, discarding this —
 * so a settled result replays for free. That is the win for soft navigation, where TransferState
 * carries no baked value and the page would otherwise re-run every aggregate over HTTP range
 * requests; it also lets pages that share an aggregate (records and an athlete both read the course
 * records, winner times and legend finishes) pay for it once. A rejected load is evicted, so the
 * next call retries instead of replaying the failure.
 */
export function createQueryCache(): QueryCache {
  const entries = new Map<string, Promise<unknown>>();

  return <T>(key: string, load: () => Promise<T>): Promise<T> => {
    const cached = entries.get(key) as Promise<T> | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const pending = load();

    entries.set(key, pending);
    void pending.catch(() => entries.delete(key));

    return pending;
  };
}
