import { Zippable, strToU8, zipSync } from 'fflate';

import { COLUMN_ALPHABET, COLUMN_RADIX, EMPTY_CELL, WORKBOOK_PATH, WORKBOOK_RELS_PATH } from './xlsx-reader.constant';
import {
  CELL_XML_MIDDLE,
  CELL_XML_PREFIX,
  CELL_XML_SUFFIX,
  CONTENT_TYPES_PATH,
  CONTENT_TYPES_XML,
  FIRST_ROW_NUMBER,
  PACKAGE_RELS_PATH,
  PACKAGE_RELS_XML,
  ROW_XML_MIDDLE,
  ROW_XML_PREFIX,
  ROW_XML_SUFFIX,
  SHEET_PATH,
  SHEET_XML_PREFIX,
  SHEET_XML_SUFFIX,
  WORKBOOK_RELS_XML,
  WORKBOOK_XML,
  XML_ESCAPES,
  XML_ESCAPE_PATTERN,
} from './xlsx-writer.constant';

/**
 * Writes a dense string matrix as a minimal single-sheet xlsx that `readXlsxRows` reads back
 * unchanged. Every cell is an inline string, so there is no sharedStrings part and no styles;
 * empty cells are omitted entirely and the reader restores them from the cell references.
 */
export function writeXlsxRows(rows: string[][]): Uint8Array {
  const files: Zippable = {
    [CONTENT_TYPES_PATH]: strToU8(CONTENT_TYPES_XML),
    [PACKAGE_RELS_PATH]: strToU8(PACKAGE_RELS_XML),
    [WORKBOOK_PATH]: strToU8(WORKBOOK_XML),
    [WORKBOOK_RELS_PATH]: strToU8(WORKBOOK_RELS_XML),
    [SHEET_PATH]: strToU8(sheetXmlOf(rows)),
  };

  return zipSync(files);
}

function sheetXmlOf(rows: string[][]): string {
  const body = rows.map((row, index) => rowXmlOf(row, index + FIRST_ROW_NUMBER)).join(EMPTY_CELL);

  return `${SHEET_XML_PREFIX}${body}${SHEET_XML_SUFFIX}`;
}

function rowXmlOf(row: string[], rowNumber: number): string {
  const cells = row.map((value, index) => cellXmlOf(value, index, rowNumber)).join(EMPTY_CELL);

  return `${ROW_XML_PREFIX}${rowNumber}${ROW_XML_MIDDLE}${cells}${ROW_XML_SUFFIX}`;
}

function cellXmlOf(value: string, columnIndex: number, rowNumber: number): string {
  if (value === EMPTY_CELL) {
    return EMPTY_CELL;
  }

  const reference = `${columnReferenceOf(columnIndex)}${rowNumber}`;

  return `${CELL_XML_PREFIX}${reference}${CELL_XML_MIDDLE}${escapeXml(value)}${CELL_XML_SUFFIX}`;
}

/** Converts a zero-based column index to its letters (0 → 'A', 25 → 'Z', 26 → 'AA'). */
function columnReferenceOf(columnIndex: number): string {
  let reference = EMPTY_CELL;
  let remaining = columnIndex;

  while (remaining >= 0) {
    reference = COLUMN_ALPHABET[remaining % COLUMN_RADIX] + reference;
    remaining = Math.floor(remaining / COLUMN_RADIX) - 1;
  }

  return reference;
}

function escapeXml(value: string): string {
  return value.replace(XML_ESCAPE_PATTERN, (char) => XML_ESCAPES[char]);
}
