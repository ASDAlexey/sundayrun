import { ARCHIVE_INDEX_SCHEMA_VERSION } from './archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from './archive-index.interface';
import { EXPECTED_EVENT_PATHS } from './event-paths.mock';

export const EMPTY_INDEX: ArchiveIndexFile = { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: [] };

export const NEWER_ENTRY: ArchiveIndexEntry = {
  slug: '2026-07-05',
  dateIso: '2026-07-05',
  number: 13,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 20,
  finisherCount: 18,
  avgTimeMs: 1862000,
  bestMaleMs: 1056000,
  bestFemaleMs: 1238000,
  files: {
    sourceXlsx: 'data/events/2026-07-05/source.xlsx',
    resultsJson: 'data/events/2026-07-05/results.json',
  },
};

export const OLDER_ENTRY: ArchiveIndexEntry = {
  slug: '2026-06-21',
  dateIso: '2026-06-21',
  number: 11,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 15,
  finisherCount: 12,
  avgTimeMs: 1753000,
  bestMaleMs: 1183000,
  bestFemaleMs: 1360000,
  files: {
    sourceXlsx: 'data/events/2026-06-21/source.xlsx',
    resultsJson: 'data/events/2026-06-21/results.json',
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
  finisherCount: null,
  avgTimeMs: null,
  bestMaleMs: null,
  bestFemaleMs: null,
  files: EXPECTED_EVENT_PATHS,
};

/**
 * `buildIndexEntry(RACE_EVENT, PROTOCOL_ROWS)`: slug = dateIso, participantCount = rows.length;
 * the sole 5 km finisher is a woman, so she is both the average and the female best.
 */
export const EXPECTED_NEW_ENTRY: ArchiveIndexEntry = {
  slug: '2026-06-28',
  dateIso: '2026-06-28',
  number: 12,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 3,
  finisherCount: 1,
  avgTimeMs: 1500000,
  bestMaleMs: null,
  bestFemaleMs: 1500000,
  files: EXPECTED_EVENT_PATHS,
};

/** `buildIndexEntry(RACE_EVENT, PROTOCOL_ROWS.slice(1))`: no 5 km finisher left, so every aggregate is null. */
export const EXPECTED_NO_FINISHER_ENTRY: ArchiveIndexEntry = {
  slug: '2026-06-28',
  dateIso: '2026-06-28',
  number: 12,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 2,
  finisherCount: 0,
  avgTimeMs: null,
  bestMaleMs: null,
  bestFemaleMs: null,
  files: EXPECTED_EVENT_PATHS,
};

export const EXISTING_INDEX: ArchiveIndexFile = { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: [NEWER_ENTRY, OLDER_ENTRY] };

/** Same events deliberately unsorted, with a stale entry for the re-published slug. */
export const STALE_INDEX: ArchiveIndexFile = {
  schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION,
  events: [OLDER_ENTRY, STALE_SAME_SLUG_ENTRY, NEWER_ENTRY],
};

/** Newest first after any upsert. */
export const EXPECTED_UPSERTED_EVENTS: ArchiveIndexEntry[] = [NEWER_ENTRY, EXPECTED_NEW_ENTRY, OLDER_ENTRY];
