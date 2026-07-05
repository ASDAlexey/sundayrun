import { bytesToBase64 } from '../core/encoding/base64';
import { PDF_FONT_FAMILY } from '../core/pdf/protocol-doc-definition.constant';
import { FONT_FETCH_ERROR_PREFIX, FONTS_DIRECTORY, PT_SERIF_BOLD_FILE, PT_SERIF_REGULAR_FILE } from './pdf-fonts.constant';
import { PtSerifFonts } from './pdf-fonts.interface';
import { FetchFontFn } from './pdf-fonts.type';

/**
 * Fetches both PT Serif faces (relative urls, resolved against <base href>) and
 * packs them into the pdfmake vfs plus the font descriptor. Throws on a non-OK
 * response. The fetch function is injectable for tests; the default wraps the
 * global fetch to keep its `this` binding intact.
 */
export async function loadPtSerifVfs(fetchFn: FetchFontFn = (url) => fetch(url)): Promise<PtSerifFonts> {
  const [regular, bold] = await Promise.all([
    fetchFontBase64(fetchFn, PT_SERIF_REGULAR_FILE),
    fetchFontBase64(fetchFn, PT_SERIF_BOLD_FILE),
  ]);

  return {
    vfs: { [PT_SERIF_REGULAR_FILE]: regular, [PT_SERIF_BOLD_FILE]: bold },
    fonts: {
      [PDF_FONT_FAMILY]: {
        normal: PT_SERIF_REGULAR_FILE,
        bold: PT_SERIF_BOLD_FILE,
        italics: PT_SERIF_REGULAR_FILE,
        bolditalics: PT_SERIF_REGULAR_FILE,
      },
    },
  };
}

async function fetchFontBase64(fetchFn: FetchFontFn, fileName: string): Promise<string> {
  const response = await fetchFn(`${FONTS_DIRECTORY}${fileName}`);

  if (!response.ok) {
    throw new Error(`${FONT_FETCH_ERROR_PREFIX}${fileName}`);
  }

  return bytesToBase64(new Uint8Array(await response.arrayBuffer()));
}
