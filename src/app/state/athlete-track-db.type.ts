/**
 * The slice of IndexedDB this storage actually touches.
 *
 * Declared structurally so the real browser API satisfies it as-is and a spec fake can be an
 * ordinary object — no type assertions on either side.
 */
export interface TrackDbRequest<T> {
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  result: T;
}

export interface TrackDbStore<T> {
  get(key: string): TrackDbRequest<T | undefined>;
  getAll(): TrackDbRequest<T[]>;
  put(value: T): TrackDbRequest<unknown>;
  clear(): TrackDbRequest<unknown>;
}

export interface TrackDbTransaction {
  objectStore<T>(name: string): TrackDbStore<T>;
}

export interface TrackDb {
  transaction(store: string, mode: IDBTransactionMode): TrackDbTransaction;
  createObjectStore(name: string, options: { keyPath: string }): unknown;
  close(): void;
}

export interface TrackDbOpenRequest extends TrackDbRequest<TrackDb> {
  /** Typed as the browser types it — the handler ignores the event, but the shapes must match. */
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
}

export interface TrackDbFactory {
  open(name: string, version: number): TrackDbOpenRequest;
}
