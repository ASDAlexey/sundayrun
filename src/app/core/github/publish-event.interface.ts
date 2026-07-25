import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';

/**
 * Everything needed to publish one event: metadata, formatted rows and the source workbook.
 * `sourceXlsxBytes` is null for an event timed by the built-in stopwatch — there is no workbook
 * behind it, so the publication commits no `source.xlsx` for that date at all.
 */
export interface PublishEventInput {
  event: RaceEvent;
  rows: ProtocolRow[];
  sourceXlsxBytes: Uint8Array | null;
}

/** The data commit sha a publication produced; the session pins its reads to it. */
export interface PublishEventResult {
  commitSha: string;
}
