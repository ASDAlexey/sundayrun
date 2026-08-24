import { type TrackDb, type TrackDbFactory, type TrackDbRequest, type TrackDbStore } from './athlete-track-db.type';
import { TRACK_CHECK_STORE, TRACK_DB_NAME, TRACK_DB_VERSION, TRACK_STORE } from './athlete-track.constant';
import { type AthleteTrack, type TrackDayCheck } from './athlete-track.interface';

/**
 * IndexedDB home of the personal tracks.
 *
 * Deliberately the only place they exist: nothing here is uploaded, committed or shared, and the
 * export in the UI is what makes that survivable when the device changes. `localStorage` was not
 * an option — one gzipped 5 km track is tens of kilobytes and the quota is five megabytes.
 *
 * Every read degrades to «no tracks» and every write to a no-op when the database is unavailable:
 * during prerender it does not exist at all, and a browser in private mode may refuse it.
 */
export async function readTracks(): Promise<AthleteTrack[]> {
  return await withStore<AthleteTrack, AthleteTrack[]>(TRACK_STORE, {
    mode: 'readonly',
    run: (store) => request(store.getAll()),
    fallback: [],
  });
}

export async function readTrack(slug: string): Promise<AthleteTrack | null> {
  const track = await withStore<AthleteTrack, AthleteTrack | undefined>(TRACK_STORE, {
    mode: 'readonly',
    run: (store) => request(store.get(slug)),
    fallback: undefined,
  });

  return track ?? null;
}

export async function saveTrack(track: AthleteTrack): Promise<void> {
  await withStore<AthleteTrack, unknown>(TRACK_STORE, {
    mode: 'readwrite',
    run: (store) => request(store.put(track)),
    fallback: undefined,
  });
}

export async function readChecks(): Promise<TrackDayCheck[]> {
  return await withStore<TrackDayCheck, TrackDayCheck[]>(TRACK_CHECK_STORE, {
    mode: 'readonly',
    run: (store) => request(store.getAll()),
    fallback: [],
  });
}

export async function saveCheck(check: TrackDayCheck): Promise<void> {
  await withStore<TrackDayCheck, unknown>(TRACK_CHECK_STORE, {
    mode: 'readwrite',
    run: (store) => request(store.put(check)),
    fallback: undefined,
  });
}

/** Wipes everything this device holds — what «отвязать и удалить треки» actually does. */
export async function clearTracks(): Promise<void> {
  await withStore<AthleteTrack, unknown>(TRACK_STORE, { mode: 'readwrite', run: (store) => request(store.clear()), fallback: undefined });
  await withStore<TrackDayCheck, unknown>(TRACK_CHECK_STORE, {
    mode: 'readwrite',
    run: (store) => request(store.clear()),
    fallback: undefined,
  });
}

/** Opens (and, on first use, creates) the database. */
async function openTrackDb(): Promise<TrackDb | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  const factory: TrackDbFactory = indexedDB;
  const open = factory.open(TRACK_DB_NAME, TRACK_DB_VERSION);

  // Version 1 upgrades only ever fire on a database that does not exist yet, so both stores are
  // created outright. A future version has to branch on the old version instead.
  open.onupgradeneeded = (): void => {
    open.result.createObjectStore(TRACK_STORE, { keyPath: 'slug' });
    open.result.createObjectStore(TRACK_CHECK_STORE, { keyPath: 'dateIso' });
  };

  try {
    return await request(open);
  } catch {
    // A refused database (private mode, revoked quota, a blocked upgrade) degrades to «no tracks
    // here» rather than breaking the page that asked.
    return null;
  }
}

async function withStore<TValue, TResult>(
  storeName: string,
  { mode, run, fallback }: { mode: IDBTransactionMode; run: (store: TrackDbStore<TValue>) => Promise<TResult>; fallback: TResult },
): Promise<TResult> {
  const db = await openTrackDb();

  if (db === null) {
    return fallback;
  }

  try {
    return await run(db.transaction(storeName, mode).objectStore<TValue>(storeName));
  } catch {
    return fallback;
  } finally {
    db.close();
  }
}

function request<T>(pending: TrackDbRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    pending.onsuccess = (): void => resolve(pending.result);
    pending.onerror = (): void => reject(new Error('IndexedDB request failed'));
  });
}
