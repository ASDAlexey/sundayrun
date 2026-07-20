import { TestBed } from '@angular/core/testing';

import { PUBLISH_DURATIONS_MAX_ENTRIES, PUBLISH_DURATIONS_STORAGE_KEY } from './publish-duration.constant';
import { PublishDurationService } from './publish-duration.service';
import {
  PUBLISH_DURATIONS_MALFORMED_RAW,
  PUBLISH_DURATIONS_MOCK,
  PUBLISH_DURATIONS_STORED_RAW,
  PUBLISH_DURATION_AVERAGE_MOCK,
} from './publish-duration.service.mock';

describe('PublishDurationService', () => {
  const getItem = vi.fn<(key: string) => string | null>(() => null);
  const setItem = vi.fn();

  let service: PublishDurationService;

  beforeEach(() => {
    getItem.mockReset().mockReturnValue(null);
    setItem.mockReset();
    vi.stubGlobal('localStorage', { getItem, setItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty, records durations, persists them and averages the history', () => {
    service = TestBed.inject(PublishDurationService);

    expect(service.averageMs(), 'no history yet').toBeNull();

    PUBLISH_DURATIONS_MOCK.forEach((duration) => service.record(duration));

    expect(service.averageMs()).toBe(PUBLISH_DURATION_AVERAGE_MOCK);
    expect(setItem).toHaveBeenLastCalledWith(PUBLISH_DURATIONS_STORAGE_KEY, JSON.stringify(PUBLISH_DURATIONS_MOCK));

    // The history is capped: only the last MAX entries survive a long streak of publications.
    for (let index = 0; index < PUBLISH_DURATIONS_MAX_ENTRIES + 1; index += 1) {
      service.record(PUBLISH_DURATION_AVERAGE_MOCK);
    }

    const lastStoredRaw: unknown = setItem.mock.calls.at(-1)?.[1];
    const lastStored: unknown = typeof lastStoredRaw === 'string' ? JSON.parse(lastStoredRaw) : null;

    expect(Array.isArray(lastStored) && lastStored.length).toBe(PUBLISH_DURATIONS_MAX_ENTRIES);
  });

  it('rebuilds from storage dropping garbage entries and degrades malformed JSON to no history', () => {
    getItem.mockReturnValue(PUBLISH_DURATIONS_STORED_RAW);
    service = TestBed.inject(PublishDurationService);

    expect(service.averageMs(), 'only plausible numbers count').toBe(PUBLISH_DURATION_AVERAGE_MOCK);

    TestBed.resetTestingModule();
    getItem.mockReturnValue(PUBLISH_DURATIONS_MALFORMED_RAW);
    service = TestBed.inject(PublishDurationService);

    expect(service.averageMs()).toBeNull();

    TestBed.resetTestingModule();
    getItem.mockReturnValue(JSON.stringify(PUBLISH_DURATION_AVERAGE_MOCK));
    service = TestBed.inject(PublishDurationService);

    expect(service.averageMs(), 'a non-array shape degrades to no history').toBeNull();
  });

  it('falls back to a noop storage during prerender where localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);
    service = TestBed.inject(PublishDurationService);

    expect(service.averageMs()).toBeNull();

    service.record(PUBLISH_DURATION_AVERAGE_MOCK);

    expect(service.averageMs(), 'recording still works in memory').toBe(PUBLISH_DURATION_AVERAGE_MOCK);
  });
});
