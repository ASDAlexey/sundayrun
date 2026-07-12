import { buildIndexEntry, eventNumberForDate, removeIndexEntry, renumberIndexEvents, upsertIndexEntry } from './archive-index';
import { FIRST_ARCHIVE_EVENT_NUMBER } from './archive-index.constant';
import {
  EXISTING_INDEX,
  EXPECTED_NEW_ENTRY,
  EXPECTED_NO_FINISHER_ENTRY,
  EXPECTED_RENUMBERED_STALE_EVENTS,
  EXPECTED_UPSERTED_EVENTS,
  NEWER_ENTRY,
  OLDER_ENTRY,
  STALE_INDEX,
  STALE_INDEX_DATES,
  STALE_SAME_SLUG_ENTRY,
} from './archive-index.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from './spec-utils/race-fixtures';

describe('buildIndexEntry', () => {
  it('derives the slug from dateIso, counts every row and aggregates the 5 km finishers', () => {
    expect(buildIndexEntry(RACE_EVENT, PROTOCOL_ROWS)).toEqual(EXPECTED_NEW_ENTRY);
    expect(buildIndexEntry(RACE_EVENT, PROTOCOL_ROWS.slice(1)), 'no finishers -> null aggregates').toEqual(EXPECTED_NO_FINISHER_ENTRY);
  });
});

describe('upsertIndexEntry', () => {
  it('inserts or replaces by slug, sorts newest first and never mutates the input', () => {
    const snapshot = structuredClone(STALE_INDEX);
    const inserted = upsertIndexEntry(EXISTING_INDEX, EXPECTED_NEW_ENTRY);
    const replaced = upsertIndexEntry(STALE_INDEX, EXPECTED_NEW_ENTRY);

    expect(inserted.events).toEqual(EXPECTED_UPSERTED_EVENTS);
    expect(replaced.events).toEqual(EXPECTED_UPSERTED_EVENTS);
    expect(STALE_INDEX, 'input index must stay untouched').toEqual(snapshot);
  });
});

describe('removeIndexEntry', () => {
  it('drops the entry by slug, keeps the rest in order, tolerates an unknown slug and never mutates the input', () => {
    const snapshot = structuredClone(STALE_INDEX);
    const removed = removeIndexEntry(STALE_INDEX, STALE_SAME_SLUG_ENTRY.slug);
    const untouched = removeIndexEntry(EXISTING_INDEX, STALE_SAME_SLUG_ENTRY.slug);

    expect(removed.events).toEqual([OLDER_ENTRY, NEWER_ENTRY]);
    expect(untouched.events).toEqual(EXISTING_INDEX.events);
    expect(STALE_INDEX, 'input index must stay untouched').toEqual(snapshot);
  });
});

describe('renumberIndexEvents', () => {
  it('numbers entries by chronological position from the first archive number, keeping order and inputs intact', () => {
    const snapshot = structuredClone(STALE_INDEX);
    const renumbered = renumberIndexEvents(STALE_INDEX);

    expect(renumbered.events).toEqual(EXPECTED_RENUMBERED_STALE_EVENTS);
    expect(STALE_INDEX, 'input index must stay untouched').toEqual(snapshot);
  });
});

describe('eventNumberForDate', () => {
  it('counts only strictly earlier events, so a re-published date keeps its own number', () => {
    expect(eventNumberForDate(STALE_INDEX_DATES, STALE_SAME_SLUG_ENTRY.dateIso)).toBe(EXPECTED_RENUMBERED_STALE_EVENTS[1].number);
    expect(eventNumberForDate([], STALE_SAME_SLUG_ENTRY.dateIso), 'empty archive starts the numbering').toBe(FIRST_ARCHIVE_EVENT_NUMBER);
  });
});
