import { FIVE_KM_DISTANCE_KM } from '../history/distance.constant';
import { medianMsOrNull } from '../history/median';
import { summarizeRace } from '../history/race-summary';
import { Gender, GenderType } from '../models/gender.enum';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { FIRST_ARCHIVE_EVENT_NUMBER } from './archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from './archive-index.interface';
import { eventFilePaths } from './event-paths';

/**
 * The note-derived counters land here from the rows the form publishes; the db write then
 * re-converges them (with every other event's) after the archive-wide note recompute, see
 * `recomputeEventSummaryCounts`.
 */
export function buildIndexEntry(event: RaceEvent, rows: ProtocolRow[]): ArchiveIndexEntry {
  const finisherTimesMs = fiveKmTimesMs(rows);
  const { newcomerCount, personalRecordCount } = summarizeRace(rows);

  return {
    slug: event.dateIso,
    dateIso: event.dateIso,
    number: event.number,
    legacyNumber: event.legacyNumber,
    city: event.city,
    park: event.park,
    participantCount: rows.length,
    finisherCount: finisherTimesMs.length,
    medianTimeMs: medianMsOrNull(finisherTimesMs),
    bestMaleMs: bestOf(rows, Gender.male),
    bestFemaleMs: bestOf(rows, Gender.female),
    newcomerCount,
    personalRecordCount,
    files: eventFilePaths(event.dateIso),
  };
}

/**
 * Replaces the entry with the same slug (or inserts a new one) and re-sorts by `dateIso`
 * descending (newest first). Returns a NEW file object, the input is never mutated.
 */
export function upsertIndexEntry(index: ArchiveIndexFile, entry: ArchiveIndexEntry): ArchiveIndexFile {
  const events = sortedNewestFirst([...index.events.filter((existing) => existing.slug !== entry.slug), entry]);

  return { ...index, events };
}

function sortedNewestFirst(events: ArchiveIndexEntry[]): ArchiveIndexEntry[] {
  return [...events].sort((left, right) => right.dateIso.localeCompare(left.dateIso));
}

/** Drops the entry with the given slug, keeping the order of the rest. Returns a NEW file object, the input is never mutated. */
export function removeIndexEntry(index: ArchiveIndexFile, slug: string): ArchiveIndexFile {
  return { ...index, events: index.events.filter((existing) => existing.slug !== slug) };
}

/**
 * Reassigns every entry's number by its chronological position: the oldest event becomes
 * `FIRST_ARCHIVE_EVENT_NUMBER`, each following one is +1. The db write runs it on every
 * publication and removal, so inserting or deleting any event reshuffles all later numbers.
 * Keeps the entries' order; returns a NEW file object, the input is never mutated.
 */
export function renumberIndexEvents(index: ArchiveIndexFile): ArchiveIndexFile {
  const numberBySlug = new Map<string, number>(
    [...index.events]
      .sort((left, right) => left.dateIso.localeCompare(right.dateIso))
      .map((entry, position) => [entry.slug, FIRST_ARCHIVE_EVENT_NUMBER + position]),
  );

  return { ...index, events: index.events.map((entry) => ({ ...entry, number: numberBySlug.get(entry.slug) ?? entry.number })) };
}

/**
 * The number an event held on `dateIso` gets: the archive position after every earlier event.
 * A re-published date is not counted twice (strict `<`), so the event keeps its own number.
 * The same formula as `renumberIndexEvents`, exposed for the admin form and the PDF header.
 */
export function eventNumberForDate(publishedDates: readonly string[], dateIso: string): number {
  return FIRST_ARCHIVE_EVENT_NUMBER + publishedDates.filter((published) => published < dateIso).length;
}

/** Total times of everyone who finished the full 5 km, optionally narrowed to one gender. */
function fiveKmTimesMs(rows: ProtocolRow[], gender?: GenderType): number[] {
  return rows.flatMap((row) =>
    row.distanceKm === FIVE_KM_DISTANCE_KM && row.totalMs !== null && (gender === undefined || row.gender === gender) ? [row.totalMs] : [],
  );
}

function bestOf(rows: ProtocolRow[], gender: GenderType): number | null {
  const timesMs = fiveKmTimesMs(rows, gender);

  return timesMs.length === 0 ? null : Math.min(...timesMs);
}
