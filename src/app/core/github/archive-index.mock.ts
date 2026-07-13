import { ARCHIVE_INDEX_SCHEMA_VERSION, FIRST_ARCHIVE_EVENT_NUMBER } from './archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from './archive-index.interface';
import { EXPECTED_EVENT_PATHS } from './event-paths.mock';

export const EMPTY_INDEX: ArchiveIndexFile = { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: [] };

export const NEWER_ENTRY: ArchiveIndexEntry = {
  slug: '2026-07-05',
  dateIso: '2026-07-05',
  number: 13,
  legacyNumber: null,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 20,
  finisherCount: 18,
  medianTimeMs: 1862000,
  medianMaleMs: 1810000,
  medianFemaleMs: 1984000,
  bestMaleMs: 1056000,
  bestFemaleMs: 1238000,
  newcomerCount: 3,
  personalRecordCount: 2,
  files: {
    sourceXlsx: 'data/events/2026-07-05/source.xlsx',
    resultsJson: 'data/events/2026-07-05/results.json',
  },
};

export const OLDER_ENTRY: ArchiveIndexEntry = {
  slug: '2026-06-21',
  dateIso: '2026-06-21',
  number: 11,
  legacyNumber: null,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 15,
  finisherCount: 12,
  medianTimeMs: 1753000,
  medianMaleMs: 1721000,
  medianFemaleMs: 1846000,
  bestMaleMs: 1183000,
  bestFemaleMs: 1360000,
  newcomerCount: 1,
  personalRecordCount: 0,
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
  legacyNumber: null,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 1,
  finisherCount: null,
  medianTimeMs: null,
  medianMaleMs: null,
  medianFemaleMs: null,
  bestMaleMs: null,
  bestFemaleMs: null,
  newcomerCount: null,
  personalRecordCount: null,
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
  legacyNumber: null,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 3,
  finisherCount: 1,
  medianTimeMs: 1500000,
  medianMaleMs: null,
  medianFemaleMs: 1500000,
  bestMaleMs: null,
  bestFemaleMs: 1500000,
  // The fixture rows carry no newcomer or record notes.
  newcomerCount: 0,
  personalRecordCount: 0,
  files: EXPECTED_EVENT_PATHS,
};

/** `buildIndexEntry(RACE_EVENT, PROTOCOL_ROWS.slice(1))`: no 5 km finisher left, so every aggregate is null. */
export const EXPECTED_NO_FINISHER_ENTRY: ArchiveIndexEntry = {
  slug: '2026-06-28',
  dateIso: '2026-06-28',
  number: 12,
  legacyNumber: null,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 2,
  finisherCount: 0,
  medianTimeMs: null,
  medianMaleMs: null,
  medianFemaleMs: null,
  bestMaleMs: null,
  bestFemaleMs: null,
  newcomerCount: 0,
  personalRecordCount: 0,
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

/** `STALE_INDEX` renumbered by date — 2026-06-21 → 117, 2026-06-28 → 118, 2026-07-05 → 119 — order kept. */
export const EXPECTED_RENUMBERED_STALE_EVENTS: ArchiveIndexEntry[] = [
  { ...OLDER_ENTRY, number: FIRST_ARCHIVE_EVENT_NUMBER },
  { ...STALE_SAME_SLUG_ENTRY, number: FIRST_ARCHIVE_EVENT_NUMBER + 1 },
  { ...NEWER_ENTRY, number: FIRST_ARCHIVE_EVENT_NUMBER + 2 },
];

/** The archive dates behind `STALE_INDEX`, as `eventNumberForDate` receives them. */
export const STALE_INDEX_DATES: string[] = [OLDER_ENTRY.dateIso, STALE_SAME_SLUG_ENTRY.dateIso, NEWER_ENTRY.dateIso];
