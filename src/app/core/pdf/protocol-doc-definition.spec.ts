import type { Content, ContentColumns } from 'pdfmake/interfaces';
import { buildProtocolDocDefinition } from './protocol-doc-definition';
import {
  EMPTY_FOOTER,
  PDF_FONT_FAMILY,
  PDF_FONT_SIZE,
  PDF_PAGE_MARGINS,
  PDF_PAGE_ORIENTATION,
  PDF_PAGE_SIZE,
} from './protocol-doc-definition.constant';
import { ProtocolDocInput } from './protocol-doc-definition.interface';
import {
  EXPECTED_DOC_CONTENT,
  EXPECTED_FOOTER_PAGE_COUNT,
  EXPECTED_LONG_DATE,
  EXPECTED_SIGNATURE_FOOTER,
  EXPECTED_WET_WINDLESS_WEATHER_LINE,
  FIRST_PAGE,
  FOOTER_PAGE_SIZE_MOCK,
  PDF_DOC_INPUT_MOCK,
  TEMPERATURELESS_WEATHER_MOCK,
  WET_WINDLESS_WEATHER_MOCK,
} from './protocol-doc-definition.mock';

describe('protocol-doc-definition', () => {
  it('builds the A4 protocol document mirroring the reference sample, signed in the last page footer', () => {
    const doc = buildProtocolDocDefinition(PDF_DOC_INPUT_MOCK);
    const footer = typeof doc.footer === 'function' ? doc.footer : null;

    expect(doc.pageSize).toBe(PDF_PAGE_SIZE);
    expect(doc.pageOrientation).toBe(PDF_PAGE_ORIENTATION);
    expect(doc.pageMargins).toEqual(PDF_PAGE_MARGINS);
    expect(doc.defaultStyle).toEqual({ font: PDF_FONT_FAMILY, fontSize: PDF_FONT_SIZE });
    expect(doc.content).toEqual(EXPECTED_DOC_CONTENT);
    expect(footer?.(EXPECTED_FOOTER_PAGE_COUNT, EXPECTED_FOOTER_PAGE_COUNT, FOOTER_PAGE_SIZE_MOCK)).toEqual(EXPECTED_SIGNATURE_FOOTER);
    expect(footer?.(FIRST_PAGE, EXPECTED_FOOTER_PAGE_COUNT, FOOTER_PAGE_SIZE_MOCK)).toBe(EMPTY_FOOTER);
  });

  it('writes the weather under the date only when a reading anchors it', () => {
    expect(dateColumnOf({ ...PDF_DOC_INPUT_MOCK, weather: null }), 'no stored row — the date column stays one line').toBe(
      EXPECTED_LONG_DATE,
    );
    expect(
      dateColumnOf({ ...PDF_DOC_INPUT_MOCK, weather: TEMPERATURELESS_WEATHER_MOCK }),
      'a row without a temperature reads the same',
    ).toBe(EXPECTED_LONG_DATE);
    expect(dateColumnOf({ ...PDF_DOC_INPUT_MOCK, weather: WET_WINDLESS_WEATHER_MOCK })).toBe(
      `${EXPECTED_LONG_DATE}\n${EXPECTED_WET_WINDLESS_WEATHER_LINE}`,
    );
  });
});

/** The first column of the page header — the date and, when there is one, the weather line under it. */
function dateColumnOf(input: ProtocolDocInput): unknown {
  const { content } = buildProtocolDocDefinition(input);
  const pageHeader = Array.isArray(content) ? content[0] : content;

  if (!isColumns(pageHeader)) {
    return null;
  }

  const [dateColumn] = pageHeader.columns;

  return 'text' in dateColumn ? dateColumn.text : null;
}

function isColumns(content: Content): content is ContentColumns {
  return typeof content === 'object' && 'columns' in content;
}
