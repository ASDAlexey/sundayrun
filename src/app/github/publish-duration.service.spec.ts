import { TestBed } from '@angular/core/testing';

import { DURATION_HISTORY_AVERAGE_MOCK, DURATION_HISTORY_MOCK, DURATION_HISTORY_STORED_RAW } from './duration-history.mock';
import { PUBLISH_DURATIONS_STORAGE_KEY } from './publish-duration.constant';
import { PublishDurationService } from './publish-duration.service';

describe('PublishDurationService', () => {
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
  // all this service owns is the key its measurements must never share with the delete flow.
  it('rebuilds from and persists to the publish key alone', () => {
    const service = TestBed.inject(PublishDurationService);

    expect(getItem, 'the publish key seeds the history').toHaveBeenCalledWith(PUBLISH_DURATIONS_STORAGE_KEY);
    expect(service.averageMs(), 'the stored history survives a reload, garbage dropped').toBe(DURATION_HISTORY_AVERAGE_MOCK);

    service.record(DURATION_HISTORY_AVERAGE_MOCK);

    const stored = JSON.stringify([...DURATION_HISTORY_MOCK, DURATION_HISTORY_AVERAGE_MOCK]);

    expect(setItem, 'a new measurement is appended under the publish key').toHaveBeenLastCalledWith(PUBLISH_DURATIONS_STORAGE_KEY, stored);
  });
});
