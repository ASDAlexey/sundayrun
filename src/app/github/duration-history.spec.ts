import { createDurationHistory } from './duration-history';
import { DURATION_HISTORY_MAX_ENTRIES } from './duration-history.constant';
import {
  DURATION_HISTORY_AVERAGE_MOCK,
  DURATION_HISTORY_KEY_MOCK,
  DURATION_HISTORY_MALFORMED_RAW,
  DURATION_HISTORY_MOCK,
  DURATION_HISTORY_STORED_RAW,
} from './duration-history.mock';

describe('createDurationHistory', () => {
  const getItem = vi.fn<(key: string) => string | null>(() => null);
  const setItem = vi.fn();

  beforeEach(() => {
    getItem.mockReset().mockReturnValue(null);
    setItem.mockReset();
    vi.stubGlobal('localStorage', { getItem, setItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty, records durations under the given key, averages them and caps the history', () => {
    const history = createDurationHistory(DURATION_HISTORY_KEY_MOCK);

    expect(getItem, 'the history is seeded from the key it was handed').toHaveBeenCalledWith(DURATION_HISTORY_KEY_MOCK);
    expect(history.averageMs(), 'no history yet').toBeNull();

    DURATION_HISTORY_MOCK.forEach((duration) => history.record(duration));

    expect(history.averageMs()).toBe(DURATION_HISTORY_AVERAGE_MOCK);
    expect(setItem).toHaveBeenLastCalledWith(DURATION_HISTORY_KEY_MOCK, JSON.stringify(DURATION_HISTORY_MOCK));

    // The history is capped: only the last MAX entries survive a long streak of measurements.
    for (let index = 0; index < DURATION_HISTORY_MAX_ENTRIES + 1; index += 1) {
      history.record(DURATION_HISTORY_AVERAGE_MOCK);
    }

    const lastStoredRaw: unknown = setItem.mock.calls.at(-1)?.[1];
    const lastStored: unknown = typeof lastStoredRaw === 'string' ? JSON.parse(lastStoredRaw) : null;

    expect(Array.isArray(lastStored) && lastStored.length).toBe(DURATION_HISTORY_MAX_ENTRIES);
  });

  it('rebuilds from storage dropping garbage entries and degrades malformed JSON to no history', () => {
    getItem.mockReturnValue(DURATION_HISTORY_STORED_RAW);

    const stored = createDurationHistory(DURATION_HISTORY_KEY_MOCK);

    expect(stored.averageMs(), 'only plausible numbers count').toBe(DURATION_HISTORY_AVERAGE_MOCK);

    getItem.mockReturnValue(DURATION_HISTORY_MALFORMED_RAW);

    expect(createDurationHistory(DURATION_HISTORY_KEY_MOCK).averageMs(), 'broken JSON degrades to no history').toBeNull();

    getItem.mockReturnValue(JSON.stringify(DURATION_HISTORY_AVERAGE_MOCK));

    expect(createDurationHistory(DURATION_HISTORY_KEY_MOCK).averageMs(), 'a non-array shape degrades to no history').toBeNull();
  });

  it('falls back to a noop storage during prerender where localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);

    const history = createDurationHistory(DURATION_HISTORY_KEY_MOCK);

    expect(history.averageMs()).toBeNull();

    history.record(DURATION_HISTORY_AVERAGE_MOCK);

    expect(history.averageMs(), 'recording still works in memory').toBe(DURATION_HISTORY_AVERAGE_MOCK);
  });
});
