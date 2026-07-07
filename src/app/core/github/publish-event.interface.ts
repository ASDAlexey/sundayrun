import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { CommitFile } from './github-api.interface';

/** Everything needed to publish one event: metadata, formatted rows and both binary artifacts. */
export interface PublishEventInput {
  event: RaceEvent;
  rows: ProtocolRow[];
  sourceXlsxBytes: Uint8Array;
  pdfBytes: Uint8Array;
}

/**
 * `pdfUrl` is pinned to the commit sha, so the link is immutable and never cache-stale.
 * `dbSkipped` is set when the derived `data/protocol.db` could not be rebuilt (download or
 * wasm failure) and the publication went through without it — the json files remain the
 * source of truth, so this is a warning, not an error.
 */
export interface PublishEventResult {
  commitSha: string;
  pdfUrl: string;
  dbSkipped?: true;
}

/** One commit attempt's files plus whether the derived db had to be skipped on that attempt. */
export interface PublishCommitAttempt {
  files: CommitFile[];
  dbSkipped: boolean;
}
