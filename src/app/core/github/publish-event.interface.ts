import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';

/** Everything needed to publish one event: metadata, formatted rows and both binary artifacts. */
export interface PublishEventInput {
  event: RaceEvent;
  rows: ProtocolRow[];
  sourceXlsxBytes: Uint8Array;
  pdfBytes: Uint8Array;
}

/** `pdfUrl` is pinned to the commit sha, so the link is immutable and never cache-stale. */
export interface PublishEventResult {
  commitSha: string;
  pdfUrl: string;
}
