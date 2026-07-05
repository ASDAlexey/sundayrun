import { FIVE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender, GenderType } from '../models/gender.enum';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { ARCHIVE_INDEX_SCHEMA_VERSION } from './archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from './archive-index.interface';
import { eventFilePaths } from './event-paths';
import { safeJsonParse } from './safe-json-parse';

/** Parses `index.json`; null, malformed JSON or an unexpected shape yields an empty index. */
export function parseArchiveIndex(text: string | null): ArchiveIndexFile {
  const parsed = safeJsonParse(text);

  return isArchiveIndexFile(parsed) ? parsed : { schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: [] };
}

export function buildIndexEntry(event: RaceEvent, rows: ProtocolRow[]): ArchiveIndexEntry {
  const finisherTimesMs = fiveKmTimesMs(rows);

  return {
    slug: event.dateIso,
    dateIso: event.dateIso,
    number: event.number,
    city: event.city,
    park: event.park,
    participantCount: rows.length,
    finisherCount: finisherTimesMs.length,
    avgTimeMs: averageOf(finisherTimesMs),
    bestMaleMs: bestOf(rows, Gender.male),
    bestFemaleMs: bestOf(rows, Gender.female),
    files: eventFilePaths(event.dateIso),
  };
}

/**
 * Replaces the entry with the same slug (or inserts a new one) and re-sorts by `dateIso`
 * descending (newest first). Returns a NEW file object, the input is never mutated.
 */
export function upsertIndexEntry(index: ArchiveIndexFile, entry: ArchiveIndexEntry): ArchiveIndexFile {
  const events = [...index.events.filter((existing) => existing.slug !== entry.slug), entry];

  events.sort((left, right) => right.dateIso.localeCompare(left.dateIso));

  return { ...index, events };
}

/** Drops the entry with the given slug, keeping the order of the rest. Returns a NEW file object, the input is never mutated. */
export function removeIndexEntry(index: ArchiveIndexFile, slug: string): ArchiveIndexFile {
  return { ...index, events: index.events.filter((existing) => existing.slug !== slug) };
}

/** Total times of everyone who finished the full 5 km, optionally narrowed to one gender. */
function fiveKmTimesMs(rows: ProtocolRow[], gender?: GenderType): number[] {
  return rows.flatMap((row) =>
    row.distanceKm === FIVE_KM_DISTANCE_KM && row.totalMs !== null && (gender === undefined || row.gender === gender) ? [row.totalMs] : [],
  );
}

function averageOf(timesMs: number[]): number | null {
  if (timesMs.length === 0) {
    return null;
  }

  return Math.round(timesMs.reduce((sum, ms) => sum + ms, 0) / timesMs.length);
}

function bestOf(rows: ProtocolRow[], gender: GenderType): number | null {
  const timesMs = fiveKmTimesMs(rows, gender);

  return timesMs.length === 0 ? null : Math.min(...timesMs);
}

function isArchiveIndexFile(value: unknown): value is ArchiveIndexFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === ARCHIVE_INDEX_SCHEMA_VERSION &&
    'events' in value &&
    Array.isArray(value.events)
  );
}
