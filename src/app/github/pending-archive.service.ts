import { Injectable, computed, signal } from '@angular/core';

import {
  EMPTY_PENDING_ARCHIVE_CHANGES,
  PENDING_ARCHIVE_MAX_AGE_MS,
  PENDING_ARCHIVE_SSR_NOOP_STORAGE,
  PENDING_ARCHIVE_STORAGE_KEY,
} from './pending-archive.constant';
import { PendingArchiveChanges, PendingDeletion, PendingUpload } from './pending-archive.interface';
import { PendingArchiveStorage } from './pending-archive.type';

/**
 * Bridges the gap between a session's archive write and the moment the archive db reflects it. The db
 * reads run over HTTP range requests pinned to the pre-write snapshot, so /admin would otherwise show
 * a fresh upload as missing and a fresh deletion as still present until a full reload picks up the new
 * db. Uploads surface as «публикуется…» placeholder rows; deletions hide the stale row. Both are
 * localStorage-backed, so a reload inside the ~2–3 minute window keeps the corrected view, and both
 * are dropped by `reconcile` once a reloaded archive agrees (or they age out).
 */
@Injectable({ providedIn: 'root' })
export class PendingArchiveService {
  readonly #changes = signal<PendingArchiveChanges>(readStored(this.#storage.getItem(PENDING_ARCHIVE_STORAGE_KEY)));

  readonly uploads = computed(() => this.#changes().uploads);
  readonly deletions = computed(() => this.#changes().deletions);

  /** Records a just-published event; a re-publish of the same slug refreshes its single entry and unhides it. */
  addUpload(upload: PendingUpload): void {
    const changes = this.#changes();

    this.#write({
      uploads: [upload, ...changes.uploads.filter((entry) => entry.slug !== upload.slug)],
      deletions: changes.deletions.filter((entry) => entry.slug !== upload.slug),
    });
  }

  /** Records a just-deleted event; a re-delete of the same slug refreshes its single entry and drops its placeholder. */
  addDeletion(deletion: PendingDeletion): void {
    const changes = this.#changes();

    this.#write({
      uploads: changes.uploads.filter((entry) => entry.slug !== deletion.slug),
      deletions: [deletion, ...changes.deletions.filter((entry) => entry.slug !== deletion.slug)],
    });
  }

  /**
   * Drops the changes a reloaded archive already reflects, plus any that outlived the window: an upload
   * lands once the archive serves its slug, a deletion once the archive drops it.
   */
  reconcile(archivedSlugs: readonly string[], nowMs: number): void {
    const archived = new Set(archivedSlugs);
    const changes = this.#changes();

    this.#write({
      uploads: changes.uploads.filter((entry) => !archived.has(entry.slug) && !isExpired(entry, nowMs)),
      deletions: changes.deletions.filter((entry) => archived.has(entry.slug) && !isExpired(entry, nowMs)),
    });
  }

  #write(changes: PendingArchiveChanges): void {
    if (changes.uploads.length === 0 && changes.deletions.length === 0) {
      this.#storage.removeItem(PENDING_ARCHIVE_STORAGE_KEY);
    } else {
      this.#storage.setItem(PENDING_ARCHIVE_STORAGE_KEY, JSON.stringify(changes));
    }

    this.#changes.set(changes);
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): PendingArchiveStorage {
    return typeof localStorage === 'undefined' ? PENDING_ARCHIVE_SSR_NOOP_STORAGE : localStorage;
  }
}

/** A hand-edited or truncated value degrades to «nothing pending» instead of breaking the panel. */
function readStored(raw: string | null): PendingArchiveChanges {
  if (raw === null) {
    return EMPTY_PENDING_ARCHIVE_CHANGES;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isRecord(parsed)) {
      return {
        uploads: toArray(parsed['uploads']).filter(isPendingUpload),
        deletions: toArray(parsed['deletions']).filter(isPendingDeletion),
      };
    }
  } catch {
    // Fall through: broken JSON and a wrong shape degrade the same way.
  }

  return EMPTY_PENDING_ARCHIVE_CHANGES;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isExpired(entry: PendingDeletion | PendingUpload, nowMs: number): boolean {
  return nowMs - Date.parse(entry.atIso) > PENDING_ARCHIVE_MAX_AGE_MS;
}

function isPendingDeletion(value: unknown): value is PendingDeletion {
  return isRecord(value) && typeof value['slug'] === 'string' && typeof value['atIso'] === 'string';
}

function isPendingUpload(value: unknown): value is PendingUpload {
  return (
    isRecord(value) &&
    typeof value['slug'] === 'string' &&
    typeof value['atIso'] === 'string' &&
    typeof value['number'] === 'number' &&
    typeof value['dateIso'] === 'string' &&
    typeof value['participantCount'] === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
