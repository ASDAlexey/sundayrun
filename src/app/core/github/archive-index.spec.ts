import { buildIndexEntry, parseArchiveIndex, removeIndexEntry, upsertIndexEntry } from './archive-index';
import {
  EMPTY_INDEX,
  EXISTING_INDEX,
  EXPECTED_NEW_ENTRY,
  EXPECTED_NO_FINISHER_ENTRY,
  EXPECTED_UPSERTED_EVENTS,
  INVALID_INDEX_TEXTS,
  NEWER_ENTRY,
  OLDER_ENTRY,
  STALE_INDEX,
  STALE_SAME_SLUG_ENTRY,
  VALID_INDEX_TEXT,
} from './archive-index.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from './spec-utils/race-fixtures';

describe('parseArchiveIndex', () => {
  it('parses a valid index and yields an empty one for null, malformed JSON or an unexpected shape', () => {
    expect(parseArchiveIndex(VALID_INDEX_TEXT)).toEqual(EXISTING_INDEX);

    for (const text of INVALID_INDEX_TEXTS) {
      expect(parseArchiveIndex(text), `invalid input: ${text}`).toEqual(EMPTY_INDEX);
    }
  });
});

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
