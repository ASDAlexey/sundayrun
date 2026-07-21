import { TestBed } from '@angular/core/testing';

import { DELETE_DURATIONS_STORAGE_KEY } from './delete-duration.constant';
import { DeleteDurationService } from './delete-duration.service';
import { PUBLISH_DURATIONS_MOCK, PUBLISH_DURATIONS_STORED_RAW, PUBLISH_DURATION_AVERAGE_MOCK } from './publish-duration.service.mock';

describe('DeleteDurationService', () => {
  const getItem = vi.fn<(key: string) => string | null>(() => null);
  const setItem = vi.fn();

  let service: DeleteDurationService;

  beforeEach(() => {
    getItem.mockReset().mockReturnValue(null);
    setItem.mockReset();
    vi.stubGlobal('localStorage', { getItem, setItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty, records durations under its own key and rebuilds from the stored history', () => {
    service = TestBed.inject(DeleteDurationService);

    expect(service.averageMs(), 'no history yet').toBeNull();

    PUBLISH_DURATIONS_MOCK.forEach((duration) => service.record(duration));

    expect(service.averageMs()).toBe(PUBLISH_DURATION_AVERAGE_MOCK);
    expect(setItem).toHaveBeenLastCalledWith(DELETE_DURATIONS_STORAGE_KEY, JSON.stringify(PUBLISH_DURATIONS_MOCK));

    TestBed.resetTestingModule();
    getItem.mockReturnValue(PUBLISH_DURATIONS_STORED_RAW);
    service = TestBed.inject(DeleteDurationService);

    expect(service.averageMs(), 'the stored history survives a reload, garbage dropped').toBe(PUBLISH_DURATION_AVERAGE_MOCK);
  });

  it('falls back to a noop storage during prerender where localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);
    service = TestBed.inject(DeleteDurationService);

    expect(service.averageMs()).toBeNull();

    service.record(PUBLISH_DURATION_AVERAGE_MOCK);

    expect(service.averageMs(), 'recording still works in memory').toBe(PUBLISH_DURATION_AVERAGE_MOCK);
  });
});
