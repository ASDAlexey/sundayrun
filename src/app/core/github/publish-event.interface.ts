import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';

/** Everything needed to publish one event: metadata, formatted rows and the source workbook. */
export interface PublishEventInput {
  event: RaceEvent;
  rows: ProtocolRow[];
  sourceXlsxBytes: Uint8Array;
}

/** The data commit sha a publication produced; the session pins its reads to it. */
export interface PublishEventResult {
  commitSha: string;
}
