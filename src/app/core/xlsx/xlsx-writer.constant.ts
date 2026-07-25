import { INLINE_STRING_CELL_TYPE } from './xlsx-reader.constant';

/** Package part that maps every part path to its content type. */
export const CONTENT_TYPES_PATH = '[Content_Types].xml';

/** Package-level relationships: points at the workbook part. */
export const PACKAGE_RELS_PATH = '_rels/.rels';

/** Worksheet part path; the same value appears as a Target relative to xl/ in the workbook rels. */
export const SHEET_PATH = 'xl/worksheets/sheet1.xml';

/** Worksheet Target inside xl/_rels/workbook.xml.rels — resolved by the reader against xl/. */
export const SHEET_RELATIONSHIP_TARGET = 'worksheets/sheet1.xml';

/** Relationship id shared by the package → workbook and workbook → worksheet links. */
export const FIRST_RELATIONSHIP_ID = 'rId1';

export const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

export const CONTENT_TYPES_XML =
  `${XML_DECLARATION}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/xl/workbook.xml" ' +
  'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  `<Override PartName="/${SHEET_PATH}" ` +
  'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
  '</Types>';

export const PACKAGE_RELS_XML =
  `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="${FIRST_RELATIONSHIP_ID}" ` +
  'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  '</Relationships>';

export const WORKBOOK_XML =
  `${XML_DECLARATION}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
  `<sheets><sheet name="Sheet1" sheetId="1" r:id="${FIRST_RELATIONSHIP_ID}"/></sheets>` +
  '</workbook>';

export const WORKBOOK_RELS_XML =
  `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="${FIRST_RELATIONSHIP_ID}" ` +
  'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
  `Target="${SHEET_RELATIONSHIP_TARGET}"/>` +
  '</Relationships>';

export const SHEET_XML_PREFIX = `${XML_DECLARATION}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>`;

export const SHEET_XML_SUFFIX = '</sheetData></worksheet>';

export const ROW_XML_PREFIX = '<row r="';

export const ROW_XML_MIDDLE = '">';

export const ROW_XML_SUFFIX = '</row>';

export const CELL_XML_PREFIX = '<c r="';

/** `xml:space` keeps leading and trailing spaces of a cell intact on re-read. */
export const CELL_XML_MIDDLE = `" t="${INLINE_STRING_CELL_TYPE}"><is><t xml:space="preserve">`;

export const CELL_XML_SUFFIX = '</t></is></c>';

/** Row numbers in a worksheet are 1-based. */
export const FIRST_ROW_NUMBER = 1;

/** Matches every character that must be escaped inside XML text. */
export const XML_ESCAPE_PATTERN = /["&'<>]/g;

export const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
