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
  /** The number the organisers used before the positional numbering ('160' or '2.72'); null for new events. */
  legacyNumber: string | null;
  city: string;
  park: string;
  participantCount: number;
  finisherCount: number | null;
  medianTimeMs: number | null;
  /** Per-gender 5 km medians for the card's М/Ж blocks; null before the v4 backfill or with no qualifying finisher. */
  medianMaleMs: number | null;
  medianFemaleMs: number | null;
  bestMaleMs: number | null;
  bestFemaleMs: number | null;
  /** Rows noted 'Первое участие'; kept converged with the archive-wide note recompute on every db write. */
  newcomerCount: number | null;
  /** Rows with a personal record note, the legacy 'Личный рекорд' spelling included. */
  personalRecordCount: number | null;
  files: EventFilePaths;
}

/** Root of `index.json`; events are sorted by `dateIso` descending (newest first). */
export interface ArchiveIndexFile {
  schemaVersion: 1;
  events: ArchiveIndexEntry[];
}
