import { buildProtocolDocDefinition } from './protocol-doc-definition';
import { PDF_FONT_FAMILY, PDF_FONT_SIZE, PDF_PAGE_MARGINS, PDF_PAGE_ORIENTATION, PDF_PAGE_SIZE } from './protocol-doc-definition.constant';
import {
  EXPECTED_DOC_CONTENT,
  PDF_EVENT_MOCK,
  PDF_FINISH_COUNTS_MOCK,
  PDF_PREVIOUS_BESTS_MOCK,
  PDF_ROWS_MOCK,
} from './protocol-doc-definition.mock';

describe('protocol-doc-definition', () => {
  it('builds the A4 protocol document mirroring the reference sample', () => {
    const doc = buildProtocolDocDefinition(PDF_EVENT_MOCK, PDF_ROWS_MOCK, PDF_FINISH_COUNTS_MOCK, PDF_PREVIOUS_BESTS_MOCK);

    expect(doc.pageSize).toBe(PDF_PAGE_SIZE);
    expect(doc.pageOrientation).toBe(PDF_PAGE_ORIENTATION);
    expect(doc.pageMargins).toEqual(PDF_PAGE_MARGINS);
    expect(doc.defaultStyle).toEqual({ font: PDF_FONT_FAMILY, fontSize: PDF_FONT_SIZE });
    expect(doc.content).toEqual(EXPECTED_DOC_CONTENT);
  });
});
