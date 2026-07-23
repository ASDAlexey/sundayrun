import { SHARED_STRINGS_PATH, WORKBOOK_PATH, WORKBOOK_RELS_PATH } from './xlsx-reader.constant';

/**
 * Where the spec bundle lands depends on the run (the full suite bundles at the project root,
 * a scoped --include run keeps the source dir), so import.meta.url is unstable — the fixtures
 * are addressed from the working directory instead, which is the project root either way.
 */
export const FIXTURES_DIR_FROM_ROOT = 'src/app/core/xlsx/__fixtures__';

export const FIXTURE_14_FILE_NAME = '14.06.2026.xlsx';

export const FIXTURE_24_FILE_NAME = '24.05.2026.xlsx';

export const EXPECTED_HEADER_ROW = ['Name', 'Total', 'Avg/lap', 'Avg/km', 'Lap 1', 'Lap 2'];

/** Rows 1-9 (header + 8 athletes), 13-18 (NOTE! block) and two trailing empty rows. */
export const FIXTURE_14_ROW_COUNT = 17;

/** Rows 1-17 (header + 16 athletes) and 21-26 (NOTE! block). */
export const FIXTURE_24_ROW_COUNT = 23;

export const FIXTURE_14_FIRST_DATA_ROW = ['Троилин Антон', '0:19:03,028', '0:09:31,514', '0:03:48,605', '0:08:29,705', '0:10:33,323'];

const RELATIONSHIP_NAMESPACE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/** Worksheet lives at a non-default path to prove the reader resolves relationships. */
const SYNTHETIC_SHEET_PATH = 'xl/custom/data 1.xml';

const SYNTHETIC_WORKBOOK_XML =
  `<workbook xmlns:r="${RELATIONSHIP_NAMESPACE}">` + '<sheets><sheet name="Data" sheetId="1" r:id="rId7"/></sheets>' + '</workbook>';

const SYNTHETIC_RELS_XML =
  '<Relationships>' +
  '<Relationship Id="rId1" Target="styles.xml"/>' +
  '<Relationship Id="rId7" Target="custom/data 1.xml"/>' +
  '</Relationships>';

/** Exercises inlineStr, a gap at column B, an empty cell, str, default type and a cell without r. */
const SYNTHETIC_SHEET_XML =
  '<worksheet><sheetData>' +
  '<row r="1">' +
  '<c r="A1" t="inlineStr"><is><t>inline</t><t> text</t></is></c>' +
  '<c r="C1" t="str"><v>formula result</v></c>' +
  '<c r="D1"/>' +
  '<c r="E1"><v>42</v></c>' +
  '<c t="n"><v>7</v></c>' +
  '</row>' +
  '<row r="2"/>' +
  '</sheetData></worksheet>';

/** A minimal workbook without sharedStrings.xml. */
export const SYNTHETIC_XLSX_FILES: Record<string, string> = {
  [WORKBOOK_PATH]: SYNTHETIC_WORKBOOK_XML,
  [WORKBOOK_RELS_PATH]: SYNTHETIC_RELS_XML,
  [SYNTHETIC_SHEET_PATH]: SYNTHETIC_SHEET_XML,
};

export const EXPECTED_SYNTHETIC_ROWS: string[][] = [['inline text', '', 'formula result', '', '42', '7'], []];

/** The workbook references a relationship id that is absent from the rels file. */
export const BROKEN_XLSX_FILES: Record<string, string> = {
  [WORKBOOK_PATH]: SYNTHETIC_WORKBOOK_XML.replace('rId7', 'rId9'),
  [WORKBOOK_RELS_PATH]: SYNTHETIC_RELS_XML,
  [SHARED_STRINGS_PATH]: '<sst><si><t>unused</t></si></sst>',
};
