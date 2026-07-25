/** `public/` mirrors the deployed <base href>, so the relative 'fonts/…' urls resolve straight off disk. */
export const PUBLIC_DIRECTORY = 'public';

export const PDF_FILE_HEADER = '%PDF-';

/** A one-page protocol carrying two embedded PT Serif subsets never comes out this small. */
export const MIN_PDF_BYTES = 20_000;

/** pdfkit writes the ttf postscript names into the /BaseFont dictionaries of the embedded subsets. */
export const EMBEDDED_FONT_NAMES = ['PTSerif-Regular', 'PTSerif-Bold'];

/** The standard face pdfmake falls back to whenever the vfs lookup misses — must never appear. */
export const FALLBACK_FONT_NAME = 'Helvetica';

/** Subsetting both faces and deflating the page streams outruns the default 5s vitest budget. */
export const RENDER_TIMEOUT_MS = 30_000;

/** The protocol is a single A4 portrait page: 595×842 pt, rounded because pdf.js reports fractions. */
export const A4_PORTRAIT_WIDTH_PT = 595;

export const A4_PORTRAIT_HEIGHT_PT = 842;

export const EXPECTED_PAGE_COUNT = 1;

export const HEX_RADIX = 16;

/** One byte is two hex digits, zero-padded. */
export const HEX_BYTE_WIDTH = 2;

export const TO_HEX_METHOD = 'toHex';
