import { BLOB_URL_REVOKE_DELAY_MS } from './blob-download.constant';

/**
 * Saves a blob to disk through a transient object-url anchor click; browser-only, so only ever
 * called from a user gesture with the injected `DOCUMENT`. The url is revoked on a later macrotask
 * because some browsers (Safari) abort a download whose object url is revoked in the same
 * synchronous turn as the click.
 */
export function triggerBlobDownload(doc: Document, blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = doc.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  doc.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_REVOKE_DELAY_MS);
}
