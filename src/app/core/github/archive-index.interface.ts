import { EventFilePaths } from './event-paths.interface';

/**
 * One published event inside `index.json`; `slug` doubles as the event directory name.
 * The 5 km aggregates feed the race list cards; each is null when unknown (a legacy
 * index entry) or when no finisher qualifies (e.g. no women ran the full distance).
 */
export interface ArchiveIndexEntry {
  slug: string;
  dateIso: string;
  number: number;
  city: string;
  park: string;
  participantCount: number;
  finisherCount: number | null;
  avgTimeMs: number | null;
  bestMaleMs: number | null;
  bestFemaleMs: number | null;
  files: EventFilePaths;
}

/** Root of `index.json`; events are sorted by `dateIso` descending (newest first). */
export interface ArchiveIndexFile {
  schemaVersion: 1;
  events: ArchiveIndexEntry[];
}
