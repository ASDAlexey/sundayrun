import { ARCHIVE_INDEX_SCHEMA_VERSION } from './archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from './archive-index.interface';
import { EXPECTED_EVENT_PATHS } from './event-paths.mock';

export const EMPTY_INDEX: ArchiveIndexFile = { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: [] };

/** Failing each guard branch: non-object, null, missing/wrong schemaVersion, missing/non-array events. */
export const INVALID_INDEX_TEXTS: (string | null)[] = [
  null,
  'not json',
  '"string"',
  '5',
  'null',
  '{}',
  '{"schemaVersion":2,"events":[]}',
  '{"schemaVersion":1}',
  '{"schemaVersion":1,"events":{}}',
];

export const NEWER_ENTRY: ArchiveIndexEntry = {
  slug: '2026-07-05',
  dateIso: '2026-07-05',
  number: 13,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 20,
  files: {
    sourceXlsx: 'events/2026-07-05/source.xlsx',
    protocolPdf: 'events/2026-07-05/protocol.pdf',
    resultsJson: 'events/2026-07-05/results.json',
  },
};

export const OLDER_ENTRY: ArchiveIndexEntry = {
  slug: '2026-06-21',
  dateIso: '2026-06-21',
  number: 11,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 15,
  files: {
    sourceXlsx: 'events/2026-06-21/source.xlsx',
    protocolPdf: 'events/2026-06-21/protocol.pdf',
    resultsJson: 'events/2026-06-21/results.json',
  },
};

/** A previous publication of the same event, superseded by `EXPECTED_NEW_ENTRY` on re-publish. */
export const STALE_SAME_SLUG_ENTRY: ArchiveIndexEntry = {
  slug: '2026-06-28',
  dateIso: '2026-06-28',
  number: 12,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 1,
  files: EXPECTED_EVENT_PATHS,
};

/** `buildIndexEntry(RACE_EVENT, PROTOCOL_ROWS)`: slug = dateIso, participantCount = rows.length. */
export const EXPECTED_NEW_ENTRY: ArchiveIndexEntry = {
  slug: '2026-06-28',
  dateIso: '2026-06-28',
  number: 12,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 3,
  files: EXPECTED_EVENT_PATHS,
};

export const EXISTING_INDEX: ArchiveIndexFile = { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: [NEWER_ENTRY, OLDER_ENTRY] };

export const VALID_INDEX_TEXT = JSON.stringify(EXISTING_INDEX);

/** Same events deliberately unsorted, with a stale entry for the re-published slug. */
export const STALE_INDEX: ArchiveIndexFile = {
  schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION,
  events: [OLDER_ENTRY, STALE_SAME_SLUG_ENTRY, NEWER_ENTRY],
};

/** Newest first after any upsert. */
export const EXPECTED_UPSERTED_EVENTS: ArchiveIndexEntry[] = [NEWER_ENTRY, EXPECTED_NEW_ENTRY, OLDER_ENTRY];
