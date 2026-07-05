import { Unzipped, unzipSync } from 'fflate';

import {
  CELL_REFERENCE_ATTRIBUTE,
  CELL_TAG,
  CELL_TYPE_ATTRIBUTE,
  COLUMN_ALPHABET,
  COLUMN_RADIX,
  EMPTY_CELL,
  INLINE_STRING_CELL_TYPE,
  RELATIONSHIP_ID_ATTRIBUTE,
  RELATIONSHIP_TAG,
  RELATIONSHIP_TARGET_ATTRIBUTE,
  ROW_TAG,
  SHARED_ITEM_TAG,
  SHARED_STRINGS_PATH,
  SHARED_STRING_CELL_TYPE,
  SHEET_RELATIONSHIP_ATTRIBUTE,
  SHEET_TAG,
  TEXT_TAG,
  VALUE_TAG,
  WORKBOOK_PATH,
  WORKBOOK_RELS_PATH,
  WORKSHEET_NOT_FOUND_MESSAGE,
  XL_ROOT,
  XML_MIME_TYPE,
} from './xlsx-reader.constant';

/**
 * Reads the first worksheet of an xlsx file (LibreOffice or Excel) into a dense
 * string matrix: one string[] per row element, '' for skipped cells within a row.
 * The worksheet path is resolved via the workbook relationships, never hardcoded.
 */
export function readXlsxRows(bytes: Uint8Array): string[][] {
  const files = unzipSync(bytes);
  const sharedStrings = readSharedStrings(files);
  const sheet = parseXml(files[resolveFirstSheetPath(files)]);

  return Array.from(sheet.getElementsByTagName(ROW_TAG)).map((row) => readRow(row, sharedStrings));
}

function resolveFirstSheetPath(files: Unzipped): string {
  const workbook = parseXml(files[WORKBOOK_PATH]);
  const relationships = parseXml(files[WORKBOOK_RELS_PATH]);
  const sheetRelationshipId = workbook.getElementsByTagName(SHEET_TAG)[0].getAttribute(SHEET_RELATIONSHIP_ATTRIBUTE);

  for (const relationship of Array.from(relationships.getElementsByTagName(RELATIONSHIP_TAG))) {
    if (relationship.getAttribute(RELATIONSHIP_ID_ATTRIBUTE) === sheetRelationshipId) {
      return `${XL_ROOT}${relationship.getAttribute(RELATIONSHIP_TARGET_ATTRIBUTE)}`;
    }
  }

  throw new Error(WORKSHEET_NOT_FOUND_MESSAGE);
}

function readSharedStrings(files: Unzipped): string[] {
  if (!(SHARED_STRINGS_PATH in files)) {
    return [];
  }

  const items = parseXml(files[SHARED_STRINGS_PATH]).getElementsByTagName(SHARED_ITEM_TAG);

  return Array.from(items).map((item) => joinedTextOf(item));
}

function readRow(row: Element, sharedStrings: string[]): string[] {
  const cells: string[] = [];

  for (const cell of Array.from(row.getElementsByTagName(CELL_TAG))) {
    const columnIndex = columnIndexOf(cell, cells.length);

    while (cells.length < columnIndex) {
      cells.push(EMPTY_CELL);
    }

    cells.push(cellValueOf(cell, sharedStrings));
  }

  return cells;
}

/** Computes the zero-based column index from the cell reference ('B3' → 1, 'AA1' → 26). */
function columnIndexOf(cell: Element, fallbackIndex: number): number {
  const reference = cell.getAttribute(CELL_REFERENCE_ATTRIBUTE);

  if (reference === null) {
    return fallbackIndex;
  }

  let index = 0;

  for (const char of reference) {
    const digit = COLUMN_ALPHABET.indexOf(char);

    if (digit === -1) {
      break;
    }

    index = index * COLUMN_RADIX + digit + 1;
  }

  return index - 1;
}

function cellValueOf(cell: Element, sharedStrings: string[]): string {
  const type = cell.getAttribute(CELL_TYPE_ATTRIBUTE);

  if (type === INLINE_STRING_CELL_TYPE) {
    return joinedTextOf(cell);
  }

  const values = cell.getElementsByTagName(VALUE_TAG);

  if (values.length === 0) {
    return EMPTY_CELL;
  }

  const value = String(values[0].textContent);

  if (type === SHARED_STRING_CELL_TYPE) {
    return sharedStrings[Number(value)];
  }

  return value;
}

/** Concatenates the text of every t element inside the given element (si or inlineStr cell). */
function joinedTextOf(element: Element): string {
  return Array.from(element.getElementsByTagName(TEXT_TAG))
    .map((text) => String(text.textContent))
    .join(EMPTY_CELL);
}

function parseXml(bytes: Uint8Array): Document {
  return new DOMParser().parseFromString(new TextDecoder().decode(bytes), XML_MIME_TYPE);
}
