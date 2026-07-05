import { buildIndexEntry, parseArchiveIndex, upsertIndexEntry } from './archive-index';
import {
  EMPTY_INDEX,
  EXISTING_INDEX,
  EXPECTED_NEW_ENTRY,
  EXPECTED_UPSERTED_EVENTS,
  INVALID_INDEX_TEXTS,
  STALE_INDEX,
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
  it('derives the slug from dateIso, counts every row and points at the event files', () => {
    expect(buildIndexEntry(RACE_EVENT, PROTOCOL_ROWS)).toEqual(EXPECTED_NEW_ENTRY);
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
