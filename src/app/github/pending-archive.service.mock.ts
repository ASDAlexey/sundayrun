import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { NEWER_ENTRY } from '../core/github/archive-index.mock';
import { PendingDeletion, PendingUpload } from './pending-archive.interface';

/** The shape the `pendingArchiveMock` factory returns; signals the spec drives, spies it asserts on. */
export interface PendingArchiveMock {
  uploads: WritableSignal<PendingUpload[]>;
  deletions: WritableSignal<PendingDeletion[]>;
  addUpload: Mock;
  addDeletion: Mock;
  reconcile: Mock;
}

/** A stubbed pending-archive service: signals the spec drives directly, spies for the mutating calls. */
export function pendingArchiveMock(): PendingArchiveMock {
  const uploads = signal<PendingUpload[]>([]);
  const deletions = signal<PendingDeletion[]>([]);

  return {
    uploads,
    deletions,
    addUpload: vi.fn((upload: PendingUpload) => uploads.set([upload])),
    addDeletion: vi.fn((deletion: PendingDeletion) => deletions.set([deletion])),
    reconcile: vi.fn(),
  };
}

/** A just-published event awaiting the rebuild — the «публикуется…» placeholder source. */
export const PENDING_UPLOAD_MOCK: PendingUpload = {
  slug: '2026-07-12',
  number: 99,
  dateIso: '2026-07-12',
  participantCount: 7,
  atIso: '2026-07-12T06:00:00.000Z',
};

/** A just-deleted event still served by the stale db — hides the matching archive row. */
export const PENDING_DELETION_MOCK: PendingDeletion = {
  slug: NEWER_ENTRY.slug,
  atIso: '2026-07-12T06:00:00.000Z',
};

/** «Now» for reconcile tests: hours after the fresh fixtures (still live), days after the aged ones (expired). */
export const PENDING_NOW_MS = Date.parse('2026-07-12T12:00:00.000Z');

/** Older than the 24h backstop relative to `PENDING_NOW_MS`, so reconcile prunes it regardless of the archive. */
export const EXPIRED_UPLOAD_MOCK: PendingUpload = {
  slug: '2026-07-01',
  number: 90,
  dateIso: '2026-07-01',
  participantCount: 4,
  atIso: '2026-07-01T06:00:00.000Z',
};

export const EXPIRED_DELETION_MOCK: PendingDeletion = {
  slug: '2026-06-14',
  atIso: '2026-06-14T06:00:00.000Z',
};

/** A hand-broken localStorage payload; a truncated write degrades to «nothing pending». */
export const MALFORMED_PENDING_JSON = '{"uploads": [1, "x", {"slug": 5}], "deletions"';

/** Valid JSON that is not the expected object (a bare number); it too degrades to «nothing pending». */
export const NON_OBJECT_PENDING_JSON = '42';
