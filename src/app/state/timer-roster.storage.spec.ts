import { EMPTY_TIMER_ROSTER_CACHE } from './timer-roster.constant';
import { readTimerRosterCache, serializeTimerRosterCache } from './timer-roster.storage';
import {
  FOREIGN_SCHEMA_ROSTER_JSON,
  MALFORMED_ROSTER_JSON,
  NON_ARRAY_ROSTER_JSON,
  NON_OBJECT_ROSTER_JSON,
  PARTLY_BROKEN_ROSTER_CACHE,
  PARTLY_BROKEN_ROSTER_JSON,
  ROSTER_RECORDS,
  ROSTER_SAVED_AT_MS,
  STORED_ROSTER_JSON,
  TIMER_ROSTER_CACHE,
  UNDATED_ROSTER_JSON,
} from './timer-roster.storage.mock';

describe('readTimerRosterCache', () => {
  it('rebuilds minimal records off the three stored fields, together with the whole archive read', () => {
    expect(readTimerRosterCache(STORED_ROSTER_JSON)).toEqual(TIMER_ROSTER_CACHE);
    expect(readTimerRosterCache(null), 'a device that never read the directory has no cache').toEqual(EMPTY_TIMER_ROSTER_CACHE);
  });

  it('degrades every unusable payload to «not cached yet» instead of throwing', () => {
    expect(readTimerRosterCache(MALFORMED_ROSTER_JSON)).toEqual(EMPTY_TIMER_ROSTER_CACHE);
    expect(readTimerRosterCache(NON_OBJECT_ROSTER_JSON)).toEqual(EMPTY_TIMER_ROSTER_CACHE);
    expect(readTimerRosterCache(FOREIGN_SCHEMA_ROSTER_JSON), 'another release wrote it').toEqual(EMPTY_TIMER_ROSTER_CACHE);
    expect(readTimerRosterCache(UNDATED_ROSTER_JSON), 'a cache with no date has nothing to show').toEqual(EMPTY_TIMER_ROSTER_CACHE);
    expect(readTimerRosterCache(NON_ARRAY_ROSTER_JSON)).toEqual({ ...EMPTY_TIMER_ROSTER_CACHE, savedAtMs: ROSTER_SAVED_AT_MS });
  });

  it('drops the entries, pairs and records that no longer match, keeping the rest of the directory', () => {
    expect(readTimerRosterCache(PARTLY_BROKEN_ROSTER_JSON)).toEqual(PARTLY_BROKEN_ROSTER_CACHE);
  });
});

describe('serializeTimerRosterCache', () => {
  it('stores only what the roster sheet needs and reads its own payload back', () => {
    const written = serializeTimerRosterCache({ ...TIMER_ROSTER_CACHE, records: ROSTER_RECORDS });

    expect(written, 'the archived runs never reach localStorage').not.toContain('participationSlugs');
    expect(readTimerRosterCache(written)).toEqual(TIMER_ROSTER_CACHE);
  });
});
