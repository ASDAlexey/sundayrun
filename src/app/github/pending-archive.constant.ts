import { PendingArchiveChanges } from './pending-archive.interface';
import { PendingArchiveStorage } from './pending-archive.type';

/** localStorage key of the session changes still ahead of the archive db (uploads awaited, deletions hidden). */
export const PENDING_ARCHIVE_STORAGE_KEY = 'parkrun.pending-archive';

/** Nothing pending is the shared empty shape for a fresh session and a fully reconciled store. */
export const EMPTY_PENDING_ARCHIVE_CHANGES: PendingArchiveChanges = { uploads: [], deletions: [] };

/** Prerender has no localStorage; a stub of the used subset lets the server render the shell. */
export const PENDING_ARCHIVE_SSR_NOOP_STORAGE: PendingArchiveStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

/** A placeholder lingers at most a day, even if the archive never reports back — a stale-entry backstop. */
export const PENDING_ARCHIVE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
