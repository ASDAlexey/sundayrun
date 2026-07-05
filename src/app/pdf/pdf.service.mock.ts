import { vi } from 'vitest';

import type { PdfDocument } from 'pdfmake/build/pdfmake';

import { PDF_FONT_FAMILY } from '../core/pdf/protocol-doc-definition.constant';
import { PT_SERIF_BOLD_FILE, PT_SERIF_REGULAR_FILE } from './pdf-fonts.constant';
import { PtSerifFonts } from './pdf-fonts.interface';

export const CREATE_PDF_MOCK = vi.fn();

export const LOAD_FONTS_MOCK = vi.fn();

/** Toggles the fake pdfmake module between the default-export and the namespace shapes. */
export const PDF_MAKE_SHAPE = { useDefault: true };

export const PDF_BLOB_MOCK = new Blob(['%PDF-mock']);

export const FONTS_MOCK: PtSerifFonts = {
  vfs: { [PT_SERIF_REGULAR_FILE]: 'cmVndWxhcg==', [PT_SERIF_BOLD_FILE]: 'Ym9sZA==' },
  fonts: { [PDF_FONT_FAMILY]: { normal: PT_SERIF_REGULAR_FILE, bold: PT_SERIF_BOLD_FILE } },
};

export const PDF_DOCUMENT_MOCK: PdfDocument = { getBlob: (callback) => callback(PDF_BLOB_MOCK) };

export const EXPECTED_FILE_NAME = 'protokol-2020-09-20.pdf';
