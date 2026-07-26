import { buildProtocolDocDefinition } from './protocol-doc-definition';
import {
  EMPTY_FOOTER,
  PDF_FONT_FAMILY,
  PDF_FONT_SIZE,
  PDF_PAGE_MARGINS,
  PDF_PAGE_ORIENTATION,
  PDF_PAGE_SIZE,
} from './protocol-doc-definition.constant';
import {
  EXPECTED_DOC_CONTENT,
  EXPECTED_FOOTER_PAGE_COUNT,
  EXPECTED_SIGNATURE_FOOTER,
  FIRST_PAGE,
  FOOTER_PAGE_SIZE_MOCK,
  PDF_EVENT_MOCK,
  PDF_FINISH_COUNTS_MOCK,
  PDF_PREVIOUS_BESTS_MOCK,
  PDF_ROWS_MOCK,
} from './protocol-doc-definition.mock';

describe('protocol-doc-definition', () => {
  it('builds the A4 protocol document mirroring the reference sample, signed in the last page footer', () => {
    const doc = buildProtocolDocDefinition(PDF_EVENT_MOCK, PDF_ROWS_MOCK, PDF_FINISH_COUNTS_MOCK, PDF_PREVIOUS_BESTS_MOCK);
    const footer = typeof doc.footer === 'function' ? doc.footer : null;

    expect(doc.pageSize).toBe(PDF_PAGE_SIZE);
    expect(doc.pageOrientation).toBe(PDF_PAGE_ORIENTATION);
    expect(doc.pageMargins).toEqual(PDF_PAGE_MARGINS);
    expect(doc.defaultStyle).toEqual({ font: PDF_FONT_FAMILY, fontSize: PDF_FONT_SIZE });
    expect(doc.content).toEqual(EXPECTED_DOC_CONTENT);
    expect(footer?.(EXPECTED_FOOTER_PAGE_COUNT, EXPECTED_FOOTER_PAGE_COUNT, FOOTER_PAGE_SIZE_MOCK)).toEqual(EXPECTED_SIGNATURE_FOOTER);
    expect(footer?.(FIRST_PAGE, EXPECTED_FOOTER_PAGE_COUNT, FOOTER_PAGE_SIZE_MOCK)).toBe(EMPTY_FOOTER);
  });
});
