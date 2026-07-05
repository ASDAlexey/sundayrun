import { EventFilePaths } from './event-paths.interface';

/** One published event inside `index.json`; `slug` doubles as the event directory name. */
export interface ArchiveIndexEntry {
  slug: string;
  dateIso: string;
  number: number;
  city: string;
  park: string;
  participantCount: number;
  files: EventFilePaths;
}

/** Root of `index.json`; events are sorted by `dateIso` descending (newest first). */
export interface ArchiveIndexFile {
  schemaVersion: 1;
  events: ArchiveIndexEntry[];
}
