import { strFromU8, unzipSync } from 'fflate';

import { readXlsxRows } from './xlsx-reader';
import { CELL_XML_PREFIX, SHEET_PATH } from './xlsx-writer.constant';
import { writeXlsxRows } from './xlsx-writer';
import {
  EXPECTED_LAST_TALL_CELL_REFERENCE,
  EXPECTED_MIXED_ROWS,
  EXPECTED_PACKAGE_PATHS,
  EXPECTED_WIDE_CELL_REFERENCES,
  MIXED_ROWS,
  TALL_ROWS,
  WIDE_ROWS,
} from './xlsx-writer.mock';

function sheetXmlOf(bytes: Uint8Array): string {
  return strFromU8(unzipSync(bytes)[SHEET_PATH]);
}

describe('xlsx-writer', () => {
  it('writes a package readXlsxRows reads back: gaps, empty rows, XML specials, kept spaces and no rows at all', () => {
    const bytes = writeXlsxRows(MIXED_ROWS);

    expect(Object.keys(unzipSync(bytes)).sort()).toEqual([...EXPECTED_PACKAGE_PATHS].sort());
    expect(readXlsxRows(bytes)).toEqual(EXPECTED_MIXED_ROWS);
    expect(readXlsxRows(writeXlsxRows([]))).toEqual([]);
  });

  it('references cells beyond column Z and numbers every row', () => {
    const wideXml = sheetXmlOf(writeXlsxRows(WIDE_ROWS));
    const tallBytes = writeXlsxRows(TALL_ROWS);

    for (const reference of EXPECTED_WIDE_CELL_REFERENCES) {
      expect(wideXml, `cell ${reference}`).toContain(`${CELL_XML_PREFIX}${reference}"`);
    }

    expect(readXlsxRows(writeXlsxRows(WIDE_ROWS))).toEqual(WIDE_ROWS);
    expect(sheetXmlOf(tallBytes)).toContain(`${CELL_XML_PREFIX}${EXPECTED_LAST_TALL_CELL_REFERENCE}"`);
    expect(readXlsxRows(tallBytes)).toEqual(TALL_ROWS);
  });
});
