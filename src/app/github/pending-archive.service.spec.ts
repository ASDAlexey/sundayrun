import { TestBed } from '@angular/core/testing';

import { NEWER_ENTRY, OLDER_ENTRY } from '../core/github/archive-index.mock';
import { PENDING_ARCHIVE_STORAGE_KEY } from './pending-archive.constant';
import { PendingArchiveService } from './pending-archive.service';
import {
  EXPIRED_DELETION_MOCK,
  EXPIRED_UPLOAD_MOCK,
  MALFORMED_PENDING_JSON,
  NON_OBJECT_PENDING_JSON,
  PENDING_DELETION_MOCK,
  PENDING_NOW_MS,
  PENDING_UPLOAD_MOCK,
} from './pending-archive.service.mock';

describe('PendingArchiveService', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();
  const removeItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('records an upload and a deletion, persisting and deduping uploads by slug and number', () => {
    const service = TestBed.inject(PendingArchiveService);

    expect(getItem).toHaveBeenCalledWith(PENDING_ARCHIVE_STORAGE_KEY);
    expect(service.uploads()).toEqual([]);
    expect(service.deletions()).toEqual([]);

    service.addUpload(PENDING_UPLOAD_MOCK);

    expect(service.uploads()).toEqual([PENDING_UPLOAD_MOCK]);
    expect(setItem).toHaveBeenCalledWith(PENDING_ARCHIVE_STORAGE_KEY, JSON.stringify({ uploads: [PENDING_UPLOAD_MOCK], deletions: [] }));

    // Re-publishing the same slug refreshes the single entry, never appends a duplicate.
    const rePublished = { ...PENDING_UPLOAD_MOCK, number: 100 };
    service.addUpload(rePublished);

    expect(service.uploads()).toEqual([rePublished]);

    // Re-publishing the same number under a corrected date drops the stale entry, never strands it.
    const reDated = { ...PENDING_UPLOAD_MOCK, slug: '2026-07-19', dateIso: '2026-07-19', number: 100 };
    service.addUpload(reDated);

    expect(service.uploads(), 'a date-corrected re-publish replaces the entry with the same number').toEqual([reDated]);

    service.addDeletion(PENDING_DELETION_MOCK);

    expect(service.deletions(), 'a deletion of a different slug leaves the upload alone').toEqual([PENDING_DELETION_MOCK]);
    expect(service.uploads()).toEqual([reDated]);

    // A second deletion of another slug stacks newest-first alongside the first.
    const olderDeletion = { slug: OLDER_ENTRY.slug, atIso: PENDING_DELETION_MOCK.atIso };
    service.addDeletion(olderDeletion);

    expect(service.deletions()).toEqual([olderDeletion, PENDING_DELETION_MOCK]);
  });

  it('lets the newest change win: a deletion drops a pending upload of the same slug and vice versa', () => {
    const service = TestBed.inject(PendingArchiveService);
    const deletion = { slug: PENDING_UPLOAD_MOCK.slug, atIso: PENDING_UPLOAD_MOCK.atIso };

    service.addUpload(PENDING_UPLOAD_MOCK);
    service.addDeletion(deletion);

    expect(service.uploads(), 'deleting the just-uploaded slug drops its placeholder').toEqual([]);
    expect(service.deletions()).toEqual([deletion]);

    service.addUpload(PENDING_UPLOAD_MOCK);

    expect(service.deletions(), 're-uploading the slug unhides it').toEqual([]);
    expect(service.uploads()).toEqual([PENDING_UPLOAD_MOCK]);
  });

  it('rebuilds from localStorage and reconciles landed and expired changes, clearing the store when emptied', () => {
    getItem.mockReturnValue(
      JSON.stringify({
        uploads: [PENDING_UPLOAD_MOCK, EXPIRED_UPLOAD_MOCK],
        deletions: [PENDING_DELETION_MOCK, EXPIRED_DELETION_MOCK],
      }),
    );

    const service = TestBed.inject(PendingArchiveService);

    expect(service.uploads()).toEqual([PENDING_UPLOAD_MOCK, EXPIRED_UPLOAD_MOCK]);

    // The archive now serves the upload's slug (it lands) but still serves the deletion's slug (stays hidden).
    service.reconcile([PENDING_UPLOAD_MOCK.slug, PENDING_DELETION_MOCK.slug], [], PENDING_NOW_MS);

    expect(service.uploads(), 'the served upload and the aged one both drop').toEqual([]);
    expect(service.deletions(), 'the still-served deletion stays, the aged one drops').toEqual([PENDING_DELETION_MOCK]);

    // Reconciling against an archive that has dropped the slug lands the deletion and empties the store.
    service.reconcile([OLDER_ENTRY.slug], [], PENDING_NOW_MS);

    expect(service.deletions()).toEqual([]);
    expect(removeItem).toHaveBeenCalledWith(PENDING_ARCHIVE_STORAGE_KEY);
  });

  it('retires a pending upload once the archive serves its number, even under a different slug', () => {
    getItem.mockReturnValue(JSON.stringify({ uploads: [PENDING_UPLOAD_MOCK], deletions: [] }));

    const service = TestBed.inject(PendingArchiveService);

    // A date-corrected re-publish lands under a new slug but keeps the number; matching the slug alone
    // would strand this placeholder next to the real row, so the number retires it.
    service.reconcile([OLDER_ENTRY.slug], [PENDING_UPLOAD_MOCK.number], PENDING_NOW_MS);

    expect(service.uploads(), 'the upload lands by number despite its slug being absent').toEqual([]);
  });

  it('degrades a malformed or non-object stored value to nothing pending', () => {
    getItem.mockReturnValue(MALFORMED_PENDING_JSON);

    expect(TestBed.inject(PendingArchiveService).uploads(), 'broken json is empty').toEqual([]);
  });

  it('degrades valid JSON that is not the expected object to nothing pending', () => {
    getItem.mockReturnValue(NON_OBJECT_PENDING_JSON);

    expect(TestBed.inject(PendingArchiveService).deletions()).toEqual([]);
  });

  it('drops stored entries of the wrong shape while keeping the valid ones', () => {
    getItem.mockReturnValue(JSON.stringify({ uploads: [PENDING_UPLOAD_MOCK, { slug: NEWER_ENTRY.slug }], deletions: 'not-an-array' }));

    const service = TestBed.inject(PendingArchiveService);

    expect(service.uploads(), 'a partial upload row is discarded').toEqual([PENDING_UPLOAD_MOCK]);
    expect(service.deletions()).toEqual([]);
  });

  it('falls back to a noop storage during prerender where localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);

    const service = TestBed.inject(PendingArchiveService);

    expect(service.uploads()).toEqual([]);

    service.addUpload(PENDING_UPLOAD_MOCK);

    expect(service.uploads(), 'the in-memory view still updates without a store').toEqual([PENDING_UPLOAD_MOCK]);
  });
});
