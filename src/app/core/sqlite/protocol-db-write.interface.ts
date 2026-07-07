import { ArchiveIndexFile } from '../github/archive-index.interface';
import { EventResultsFile } from '../github/results-file.interface';
import { AthletesHistory } from '../models/athletes-history.type';

/** The updated in-memory truth after a publication: the full index and the full athletes rollup. */
export interface ProtocolDbState {
  indexFile: ArchiveIndexFile;
  history: AthletesHistory;
}

/** Publication payload: the updated state plus the published event's results file. */
export interface ProtocolDbEventUpdate extends ProtocolDbState {
  resultsFile: EventResultsFile;
}

/** Deletion payload: the updated state plus the removed event's slug. */
export interface ProtocolDbEventRemoval extends ProtocolDbState {
  slug: string;
}

/** `events.club_name`/`events.chairman` of one row — data that only per-event results files carry. */
export interface ProtocolDbEventMeta {
  clubName: string;
  chairman: string;
}
