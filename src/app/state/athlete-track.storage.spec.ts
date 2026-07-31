import { IDBFactory } from 'fake-indexeddb';

import { AthleteTrack } from './athlete-track.interface';
import { clearTracks, readChecks, readTrack, readTracks, saveCheck, saveTrack } from './athlete-track.storage';
import { SECOND_TRACK_MOCK, TRACK_CHECK_MOCK, TRACK_MOCK, TRACK_SLUG_MOCK } from './athlete-track.mock';
import { TrackDb, TrackDbFactory, TrackDbOpenRequest, TrackDbTransaction } from './athlete-track-db.type';

/** A database handle that opens fine but refuses transactions, the way a deleted store behaves. */
const brokenDb: TrackDb = {
  transaction: (): TrackDbTransaction => {
    throw new Error('store is gone');
  },
  createObjectStore: (): unknown => undefined,
  close: (): void => undefined,
};

/** A factory whose open either fails outright or hands back a database that cannot be used. */
const fakeFactory = (outcome: 'error' | 'success'): TrackDbFactory => ({
  open: (): TrackDbOpenRequest => {
    const pending: TrackDbOpenRequest = { onsuccess: null, onerror: null, onupgradeneeded: null, result: brokenDb };

    queueMicrotask(() => (outcome === 'error' ? pending.onerror?.(new Event('error')) : pending.onsuccess?.(new Event('success'))));

    return pending;
  },
});

/**
 * The stored bytes come back through structured clone, so under jsdom they carry a `Uint8Array`
 * from another realm: identical content, different constructor, which `toEqual` refuses. Comparing
 * the gzip as a plain array keeps the assertion about the data instead of about realms.
 */
const withPlainGzip = (track: AthleteTrack | null): unknown => (track === null ? null : { ...track, gpxGzip: Array.from(track.gpxGzip) });

describe('athlete track storage', () => {
  beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a track and reads it back by race slug', async () => {
    await saveTrack(TRACK_MOCK);

    expect(withPlainGzip(await readTrack(TRACK_SLUG_MOCK))).toEqual(withPlainGzip(TRACK_MOCK));
    expect((await readTracks()).map(withPlainGzip)).toEqual([withPlainGzip(TRACK_MOCK)]);
  });

  it('reports an unknown race as no track rather than failing', async () => {
    await expect(readTrack(TRACK_SLUG_MOCK)).resolves.toBeNull();
  });

  it('replaces the track of a race that was synced twice', async () => {
    const resynced = { ...TRACK_MOCK, activityId: 'resynced' };

    await saveTrack(TRACK_MOCK);
    await saveTrack(resynced);

    expect((await readTracks()).map(withPlainGzip)).toEqual([withPlainGzip(resynced)]);
  });

  it('journals the days already asked about', async () => {
    await saveCheck(TRACK_CHECK_MOCK);

    await expect(readChecks()).resolves.toEqual([TRACK_CHECK_MOCK]);
  });

  it('wipes both stores when the account is unlinked', async () => {
    await saveTrack(TRACK_MOCK);
    await saveTrack(SECOND_TRACK_MOCK);
    await saveCheck(TRACK_CHECK_MOCK);

    await clearTracks();

    await expect(readTracks()).resolves.toEqual([]);
    await expect(readChecks()).resolves.toEqual([]);
  });

  it('degrades to «no storage» during prerender, where IndexedDB does not exist', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await expect(readTracks()).resolves.toEqual([]);
    await expect(readTrack(TRACK_SLUG_MOCK)).resolves.toBeNull();
    await expect(readChecks()).resolves.toEqual([]);
    await expect(saveTrack(TRACK_MOCK)).resolves.toBeUndefined();
    await expect(saveCheck(TRACK_CHECK_MOCK)).resolves.toBeUndefined();
    await expect(clearTracks()).resolves.toBeUndefined();
  });

  it('degrades the same way when the browser refuses the database', async () => {
    vi.stubGlobal('indexedDB', fakeFactory('error'));

    await expect(readTracks()).resolves.toEqual([]);
  });

  it('degrades the same way when a transaction cannot be opened', async () => {
    vi.stubGlobal('indexedDB', fakeFactory('success'));

    await expect(readTracks()).resolves.toEqual([]);
  });
});
