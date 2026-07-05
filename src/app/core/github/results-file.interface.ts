import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';

/** Machine-readable `results.json` stored next to each published protocol. */
export interface EventResultsFile {
  schemaVersion: 1;
  event: RaceEvent;
  rows: ProtocolRow[];
}
