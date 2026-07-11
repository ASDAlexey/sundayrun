import { DOCUMENT, Injectable, inject } from '@angular/core';

import {
  PDF_WORKER_PUBLIC_PATH,
  PROTOCOL_IMAGE_MIME_TYPE,
  PROTOCOL_IMAGE_PAGE,
  PROTOCOL_IMAGE_RENDER_ERROR,
  PROTOCOL_IMAGE_SCALE,
} from './protocol-image.service.constant';

/**
 * Rasterizes the first page of a protocol PDF into a PNG blob via a lazily-imported pdf.js, so
 * the protocol can be shared to VK as an inline photo (posted in the feed) instead of a document
 * attachment. Browser-only: renders onto a detached `<canvas>` from the injected DOCUMENT; the
 * heavy pdf.js bytes and its worker stay out of the initial bundle.
 */
@Injectable({ providedIn: 'root' })
export class ProtocolImageService {
  readonly #document = inject(DOCUMENT);

  /** Renders `pdf`'s first page to a PNG blob at `PROTOCOL_IMAGE_SCALE`. */
  async render(pdf: Blob): Promise<Blob> {
    const pdfjs = await import('pdfjs-dist');

    pdfjs.GlobalWorkerOptions.workerSrc = new URL(PDF_WORKER_PUBLIC_PATH, this.#document.baseURI).href;

    const pdfDocument = await pdfjs.getDocument({ data: await pdf.arrayBuffer() }).promise;
    const page = await pdfDocument.getPage(PROTOCOL_IMAGE_PAGE);
    const viewport = page.getViewport({ scale: PROTOCOL_IMAGE_SCALE });
    const canvas = this.#document.createElement('canvas');

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvas, viewport }).promise;

    return canvasToBlob(canvas);
  }
}

/** Wraps the callback-based `toBlob`; a null blob (encoding failed) rejects so the caller can fall back. */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob === null ? reject(new Error(PROTOCOL_IMAGE_RENDER_ERROR)) : resolve(blob)), PROTOCOL_IMAGE_MIME_TYPE);
  });
}
