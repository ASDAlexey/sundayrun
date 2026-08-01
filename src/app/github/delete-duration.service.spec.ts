import { TestBed } from '@angular/core/testing';

import { DELETE_DURATIONS_STORAGE_KEY } from './delete-duration.constant';
import { DeleteDurationService } from './delete-duration.service';
import { DURATION_HISTORY_AVERAGE_MOCK, DURATION_HISTORY_MOCK, DURATION_HISTORY_STORED_RAW } from './duration-history.mock';

describe('DeleteDurationService', () => {
  const getItem = vi.fn<(key: string) => string | null>(() => null);
  const setItem = vi.fn();

  beforeEach(() => {
    getItem.mockReset().mockReturnValue(DURATION_HISTORY_STORED_RAW);
    setItem.mockReset();
    vi.stubGlobal('localStorage', { getItem, setItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Reading, averaging and capping are the shared history's job (duration-history.spec.ts);
  // all this service owns is the key that keeps delete timings out of the publish average.
  it('rebuilds from and persists to the delete key alone', () => {
    const service = TestBed.inject(DeleteDurationService);

    expect(getItem, 'the delete key seeds the history').toHaveBeenCalledWith(DELETE_DURATIONS_STORAGE_KEY);
    expect(service.averageMs(), 'the stored history survives a reload, garbage dropped').toBe(DURATION_HISTORY_AVERAGE_MOCK);

    service.record(DURATION_HISTORY_AVERAGE_MOCK);

    const stored = JSON.stringify([...DURATION_HISTORY_MOCK, DURATION_HISTORY_AVERAGE_MOCK]);

    expect(setItem, 'a new measurement is appended under the delete key').toHaveBeenLastCalledWith(DELETE_DURATIONS_STORAGE_KEY, stored);
  });
});
