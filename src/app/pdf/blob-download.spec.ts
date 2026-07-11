import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { triggerBlobDownload } from './blob-download';
import { BLOB_URL_REVOKE_DELAY_MS } from './blob-download.constant';
import { DOWNLOAD_BLOB_MOCK, DOWNLOAD_FILE_NAME, OBJECT_URL_MOCK } from './blob-download.mock';

describe('triggerBlobDownload', () => {
  let doc: Document;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(OBJECT_URL_MOCK);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    TestBed.configureTestingModule({});
    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clicks a transient anchor for the blob and revokes the url only after the delay', () => {
    triggerBlobDownload(doc, DOWNLOAD_BLOB_MOCK, DOWNLOAD_FILE_NAME);

    expect(URL.createObjectURL).toHaveBeenCalledExactlyOnceWith(DOWNLOAD_BLOB_MOCK);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(doc.querySelector('a[download]'), 'the anchor is removed right after the click').toBeNull();
    expect(URL.revokeObjectURL, 'the url survives the synchronous click').not.toHaveBeenCalled();

    vi.advanceTimersByTime(BLOB_URL_REVOKE_DELAY_MS);

    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(OBJECT_URL_MOCK);
  });
});
