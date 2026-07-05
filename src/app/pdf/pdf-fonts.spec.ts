import { PDF_FONT_FAMILY } from '../core/pdf/protocol-doc-definition.constant';
import { loadPtSerifVfs } from './pdf-fonts';
import { FONT_FETCH_ERROR_PREFIX, PT_SERIF_BOLD_FILE, PT_SERIF_REGULAR_FILE } from './pdf-fonts.constant';
import {
  BOLD_FONT_BYTES,
  EXPECTED_BOLD_BASE64,
  EXPECTED_BOLD_URL,
  EXPECTED_REGULAR_BASE64,
  EXPECTED_REGULAR_URL,
  REGULAR_FONT_BYTES,
} from './pdf-fonts.mock';

describe('loadPtSerifVfs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches both faces, converts them into a base64 vfs and builds the PT Serif descriptor', async () => {
    const fetchFn = vi.fn((url: string) =>
      Promise.resolve(new Response(url === EXPECTED_REGULAR_URL ? REGULAR_FONT_BYTES : BOLD_FONT_BYTES)),
    );

    const result = await loadPtSerifVfs(fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(EXPECTED_REGULAR_URL);
    expect(fetchFn).toHaveBeenCalledWith(EXPECTED_BOLD_URL);
    expect(result.vfs).toEqual({ [PT_SERIF_REGULAR_FILE]: EXPECTED_REGULAR_BASE64, [PT_SERIF_BOLD_FILE]: EXPECTED_BOLD_BASE64 });
    expect(result.fonts).toEqual({
      [PDF_FONT_FAMILY]: {
        normal: PT_SERIF_REGULAR_FILE,
        bold: PT_SERIF_BOLD_FILE,
        italics: PT_SERIF_REGULAR_FILE,
        bolditalics: PT_SERIF_REGULAR_FILE,
      },
    });
  });

  it('falls back to the global fetch by default and throws on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 404 }))),
    );

    await expect(loadPtSerifVfs()).rejects.toThrow(`${FONT_FETCH_ERROR_PREFIX}${PT_SERIF_REGULAR_FILE}`);
  });
});
