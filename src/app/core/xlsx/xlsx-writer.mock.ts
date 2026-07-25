import { WORKBOOK_PATH, WORKBOOK_RELS_PATH } from './xlsx-reader.constant';
import { CONTENT_TYPES_PATH, PACKAGE_RELS_PATH, SHEET_PATH } from './xlsx-writer.constant';

/** Every part the writer emits; nothing else belongs in the package. */
export const EXPECTED_PACKAGE_PATHS: string[] = [CONTENT_TYPES_PATH, PACKAGE_RELS_PATH, WORKBOOK_PATH, WORKBOOK_RELS_PATH, SHEET_PATH];

/** A gap at column C, a fully empty row, XML specials, surrounding spaces and trailing empty cells. */
export const MIXED_ROWS: string[][] = [['Name', 'Total', '', 'Avg/km'], [], ['&<>"\'', ' spaced ', 'tail'], ['only'], ['', 'B', '']];

/** Trailing empty cells have no reference to restore them, so the reader stops at the last written cell. */
export const EXPECTED_MIXED_ROWS: string[][] = [['Name', 'Total', '', 'Avg/km'], [], ['&<>"\'', ' spaced ', 'tail'], ['only'], ['', 'B']];

/** Wide enough to reach two-letter column references (column 27 is AA, column 30 is AD). */
export const WIDE_ROW_COLUMN_COUNT = 30;

export const WIDE_ROWS: string[][] = [Array.from({ length: WIDE_ROW_COLUMN_COUNT }, (_unused, index) => `cell ${index}`)];

/** References that must appear in the worksheet of `WIDE_ROWS`: first, last single-letter, first and last two-letter. */
export const EXPECTED_WIDE_CELL_REFERENCES: string[] = ['A1', 'Z1', 'AA1', 'AD1'];

/** Row numbering is 1-based, so a 30-row sheet ends at r="30". */
export const TALL_ROW_COUNT = 30;

export const TALL_ROWS: string[][] = Array.from({ length: TALL_ROW_COUNT }, (_unused, index) => [`row ${index}`]);

export const EXPECTED_LAST_TALL_CELL_REFERENCE = `A${TALL_ROW_COUNT}`;
