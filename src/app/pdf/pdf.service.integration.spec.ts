import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { TestBed } from '@angular/core/testing';

import {
  EXPECTED_LONG_DATE,
  PDF_EVENT_MOCK,
  PDF_FINISH_COUNTS_MOCK,
  PDF_PREVIOUS_BESTS_MOCK,
  PDF_ROWS_MOCK,
} from '../core/pdf/protocol-doc-definition.mock';
import { loadPtSerifVfs } from './pdf-fonts';
import { PdfFontsService } from './pdf-fonts.service';
import {
  A4_PORTRAIT_HEIGHT_PT,
  A4_PORTRAIT_WIDTH_PT,
  EMBEDDED_FONT_NAMES,
  EXPECTED_PAGE_COUNT,
  FALLBACK_FONT_NAME,
  HEX_BYTE_WIDTH,
  HEX_RADIX,
  MIN_PDF_BYTES,
  PDF_FILE_HEADER,
  PUBLIC_DIRECTORY,
  RENDER_TIMEOUT_MS,
  TO_HEX_METHOD,
} from './pdf.service.integration.constant';
import { PdfService } from './pdf.service';
import { PROTOCOL_IMAGE_PAGE } from './protocol-image.service.constant';

/**
 * The unit specs mock pdfmake and pdf.js away, so nothing there would notice a breaking change in
 * either library — the pdfmake 0.2 → 0.3 upgrade moved the vfs and the font dictionary out of
 * `createPdf` into global registration calls and turned `getBlob` from a callback into a promise.
 * These specs drive the real bundles against the real PT Serif files: the only way to catch a
 * silent fallback to the built-in Helvetica (the protocol is Cyrillic — that fallback renders
 * blank glyphs) or an output pdf.js can no longer parse for the VK photo share.
 */
describe('PdfService against the real pdfmake bundle', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PdfFontsService, useValue: { load: () => loadPtSerifVfs(fetchFontFromDisk) } }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Uint8Array.prototype, TO_HEX_METHOD);
  });

  it(
    'renders a valid PDF with both PT Serif faces embedded and no standard-font fallback',
    async () => {
      const blob = await renderProtocol();
      // The PDF object dictionaries are plain latin1 bytes even though the page streams are deflated.
      const bytes = new TextDecoder('latin1').decode(await blob.arrayBuffer());

      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(MIN_PDF_BYTES);
      expect(bytes.startsWith(PDF_FILE_HEADER)).toBe(true);

      for (const fontName of EMBEDDED_FONT_NAMES) {
        expect(bytes).toContain(fontName);
      }

      expect(bytes).not.toContain(FALLBACK_FONT_NAME);
    },
    RENDER_TIMEOUT_MS,
  );

  it(
    'produces a single A4 page pdf.js reads back with its Cyrillic text intact',
    async () => {
      installPdfJsBrowserApis();

      const pdfjs = await import('pdfjs-dist');
      const blob = await renderProtocol();
      const document = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
      const page = await document.getPage(PROTOCOL_IMAGE_PAGE);
      const viewport = page.getViewport({ scale: 1 });

      expect(document.numPages).toBe(EXPECTED_PAGE_COUNT);
      expect(Math.round(viewport.width)).toBe(A4_PORTRAIT_WIDTH_PT);
      expect(Math.round(viewport.height)).toBe(A4_PORTRAIT_HEIGHT_PT);
      // Readable Cyrillic proves the subset carries a ToUnicode map rather than blank glyph boxes.
      expect(await pageText(page)).toContain(EXPECTED_LONG_DATE);
    },
    RENDER_TIMEOUT_MS,
  );
});

/**
 * Fills the two browser APIs pdf.js relies on that this test runtime lacks — neither is a stand-in
 * for behaviour under test: jsdom ships no `DOMMatrix` (pdf.js news one up in a static field at
 * module scope, and only its canvas rasterizer ever reads it), and Node 24 has yet to ship
 * `Uint8Array.prototype.toHex`, which pdf.js uses to hash the document into its fingerprint.
 */
function installPdfJsBrowserApis(): void {
  vi.stubGlobal('DOMMatrix', class {});

  Object.defineProperty(Uint8Array.prototype, TO_HEX_METHOD, {
    configurable: true,
    value(this: Uint8Array): string {
      return Array.from(this, (byte) => byte.toString(HEX_RADIX).padStart(HEX_BYTE_WIDTH, '0')).join('');
    },
  });
}

function renderProtocol(): Promise<Blob> {
  return TestBed.inject(PdfService).generateProtocolBlob(PDF_EVENT_MOCK, PDF_ROWS_MOCK, PDF_FINISH_COUNTS_MOCK, PDF_PREVIOUS_BESTS_MOCK);
}

/** pdf.js hands back one item per drawn text run, so the page reads as their concatenation. */
async function pageText(page: { getTextContent(): Promise<{ items: object[] }> }): Promise<string> {
  const { items } = await page.getTextContent();

  return items.map((item) => ('str' in item && typeof item.str === 'string' ? item.str : '')).join('');
}

/** Serves the real ttf files off `public/fonts/`, exactly what the browser fetches against <base href>. */
function fetchFontFromDisk(url: string): Promise<Response> {
  return readFile(join(process.cwd(), PUBLIC_DIRECTORY, url)).then((bytes) => new Response(bytes));
}
