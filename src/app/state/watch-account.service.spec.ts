import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';

import { CorosClient } from '../core/coros/coros.client';
import { CorosRegion } from '../core/coros/coros-region.enum';
import { readTracks, saveTrack } from './athlete-track.storage';
import { TRACK_MOCK } from './athlete-track.mock';
import { WATCH_ACCOUNT_STORAGE_KEY } from './watch-account.constant';
import { WatchAccountService } from './watch-account.service';
import {
  STORED_WATCH_ACCOUNT,
  STORED_WATCH_ACCOUNT_JSON,
  UNUSABLE_WATCH_ACCOUNT_JSONS,
  WATCH_EMAIL_MOCK,
  WATCH_PASSWORD_MOCK,
  WATCH_TOKEN_MOCK,
} from './watch-account.service.mock';

describe('WatchAccountService', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();
  const removeItem = vi.fn();
  const login = vi.fn(() => Promise.resolve(WATCH_TOKEN_MOCK));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: CorosClient, useValue: { login } }] });
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    login.mockResolvedValue(WATCH_TOKEN_MOCK);
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem });
    vi.stubGlobal('indexedDB', new IDBFactory());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('links an account, keeps only the token, and drops it again on expiry', async () => {
    const service = TestBed.inject(WatchAccountService);

    expect(service.linked()).toBe(false);

    await service.link(WATCH_EMAIL_MOCK, WATCH_PASSWORD_MOCK, CorosRegion.Eu);

    expect(login).toHaveBeenCalledWith(WATCH_EMAIL_MOCK, WATCH_PASSWORD_MOCK, CorosRegion.Eu);
    expect(service.account()).toEqual(STORED_WATCH_ACCOUNT);
    expect(service.linked()).toBe(true);

    const [key, stored] = setItem.mock.calls[0];

    expect(key).toBe(WATCH_ACCOUNT_STORAGE_KEY);
    expect(stored).toContain(WATCH_TOKEN_MOCK);
    expect(stored).not.toContain(WATCH_PASSWORD_MOCK);

    service.expire();

    expect(removeItem).toHaveBeenCalledWith(WATCH_ACCOUNT_STORAGE_KEY);
    expect(service.account()).toBeNull();
  });

  it('restores a stored link and takes the tracks with it when unlinking', async () => {
    getItem.mockReturnValue(STORED_WATCH_ACCOUNT_JSON);

    const service = TestBed.inject(WatchAccountService);

    expect(service.account()).toEqual(STORED_WATCH_ACCOUNT);

    await saveTrack(TRACK_MOCK);
    await service.unlink();

    expect(service.account()).toBeNull();
    await expect(readTracks()).resolves.toEqual([]);
  });

  it('treats an unusable stored value as «not linked», prerender included', () => {
    // Built by hand rather than through `inject`, so each stored value gets a fresh read without
    // tearing the TestBed down between cases.
    const freshService = (): WatchAccountService => TestBed.runInInjectionContext(() => new WatchAccountService());

    for (const raw of UNUSABLE_WATCH_ACCOUNT_JSONS) {
      getItem.mockReturnValue(raw);

      expect(freshService().account()).toBeNull();
    }

    vi.stubGlobal('localStorage', undefined);

    expect(freshService().account()).toBeNull();
  });
});
