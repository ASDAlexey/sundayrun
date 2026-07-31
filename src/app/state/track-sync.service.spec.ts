import { TestBed } from '@angular/core/testing';
import { strFromU8, gunzipSync } from 'fflate';
import { IDBFactory } from 'fake-indexeddb';

import { CorosApiError } from '../core/coros/coros-api.error';
import { CorosClient } from '../core/coros/coros.client';
import { TRACK_CHECK_ATTEMPT_LIMIT } from './athlete-track.constant';
import { readChecks } from './athlete-track.storage';
import { TrackSyncStatus } from './track-sync.enum';
import { TrackSyncService } from './track-sync.service';
import {
  FUTURE_RACE_MOCK,
  SYNC_ACTIVITY_MOCK,
  SYNC_GPX_MOCK,
  SYNC_RACE_MOCK,
  SYNC_WARMUP_ACTIVITY_MOCK,
  TRACKLESS_RACE_MOCK,
} from './track-sync.service.mock';
import { WatchAccount } from './watch-account.interface';
import { STORED_WATCH_ACCOUNT } from './watch-account.service.mock';
import { WatchAccountService } from './watch-account.service';

describe('TrackSyncService', () => {
  const queryRuns = vi.fn(() => Promise.resolve([SYNC_ACTIVITY_MOCK, SYNC_WARMUP_ACTIVITY_MOCK]));
  const downloadGpx = vi.fn(() => Promise.resolve(SYNC_GPX_MOCK));
  const expire = vi.fn();
  const account = vi.fn((): WatchAccount | null => STORED_WATCH_ACCOUNT);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CorosClient, useValue: { queryRuns, downloadGpx } },
        { provide: WatchAccountService, useValue: { account, expire } },
      ],
    });
    vi.clearAllMocks();
    queryRuns.mockResolvedValue([SYNC_ACTIVITY_MOCK, SYNC_WARMUP_ACTIVITY_MOCK]);
    downloadGpx.mockResolvedValue(SYNC_GPX_MOCK);
    account.mockReturnValue(STORED_WATCH_ACCOUNT);
    vi.stubGlobal('indexedDB', new IDBFactory());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores the race recording, ignoring the warm-up of the same morning', async () => {
    const service = TestBed.inject(TrackSyncService);

    await service.sync([SYNC_RACE_MOCK]);

    const [track] = service.tracks();

    expect(downloadGpx).toHaveBeenCalledWith(STORED_WATCH_ACCOUNT.token, SYNC_ACTIVITY_MOCK.labelId, STORED_WATCH_ACCOUNT.region);
    expect(track.slug).toBe(SYNC_RACE_MOCK.slug);
    expect(track.distanceM).toBe(SYNC_ACTIVITY_MOCK.distanceM);
    expect(strFromU8(gunzipSync(track.gpxGzip))).toBe(SYNC_GPX_MOCK);
    expect(service.status()).toBe(TrackSyncStatus.idle);
  });

  it('asks for nothing when every race is already here, already given up on, or still ahead', async () => {
    const service = TestBed.inject(TrackSyncService);

    await service.sync([SYNC_RACE_MOCK]);
    queryRuns.mockClear();

    // The stored race needs no second look, and a future date is never worth a request.
    await service.sync([SYNC_RACE_MOCK, FUTURE_RACE_MOCK]);

    expect(queryRuns).not.toHaveBeenCalled();
  });

  it('journals an empty day and gives up on it after a few visits', async () => {
    const service = TestBed.inject(TrackSyncService);

    for (let visit = 0; visit < TRACK_CHECK_ATTEMPT_LIMIT; visit += 1) {
      await service.sync([TRACKLESS_RACE_MOCK]);
    }

    const [check] = await readChecks();

    expect(check.attempts).toBe(TRACK_CHECK_ATTEMPT_LIMIT);
    expect(service.tracks()).toEqual([]);

    queryRuns.mockClear();
    await service.sync([TRACKLESS_RACE_MOCK]);

    expect(queryRuns).not.toHaveBeenCalled();
  });

  it('drops the link when the provider refuses the token, and only reports other failures', async () => {
    const service = TestBed.inject(TrackSyncService);

    queryRuns.mockRejectedValueOnce(new CorosApiError('token expired', '1001'));
    await service.sync([SYNC_RACE_MOCK]);

    expect(service.status()).toBe(TrackSyncStatus.expired);
    expect(expire).toHaveBeenCalled();

    queryRuns.mockRejectedValueOnce(new Error('offline'));
    await service.sync([SYNC_RACE_MOCK]);

    expect(service.status()).toBe(TrackSyncStatus.failed);
    expect(expire).toHaveBeenCalledTimes(1);
  });

  it('does nothing at all without a linked account', async () => {
    account.mockReturnValue(null);

    const service = TestBed.inject(TrackSyncService);

    await service.sync([SYNC_RACE_MOCK]);
    await service.load();

    expect(queryRuns).not.toHaveBeenCalled();
    expect(service.tracks()).toEqual([]);
  });
});
