/**
 * PNG (lossless) keeps the protocol table crisp and is the format VK reliably accepts as an
 * inline photo; WebP/JPEG risk fuzzy text or a document attachment. Swap the mime + extension
 * together to change it.
 */
export const PROTOCOL_IMAGE_MIME_TYPE = 'image/png';

export const PROTOCOL_IMAGE_FILE_EXTENSION = '.png';

/** 2× the PDF point size → ~150 dpi A4, sharp enough for a feed photo without a huge blob. */
export const PROTOCOL_IMAGE_SCALE = 2;

/** The protocol is always a single A4 page. */
export const PROTOCOL_IMAGE_PAGE = 1;

export const PROTOCOL_IMAGE_RENDER_ERROR = 'protocol image could not be rendered';

/**
 * The pdf.js worker, self-hosted by `scripts/build-pdf-assets.ts` under `public/pdf/`. Resolved
 * against `document.baseURI` at runtime so it survives the deploy sub-path and locale prefix; the
 * Angular builder would not emit a bare `new URL('pdfjs-dist/…', import.meta.url)` asset.
 */
export const PDF_WORKER_PUBLIC_PATH = 'pdf/pdf.worker.min.mjs';
