export const WORKBOOK_PATH = 'xl/workbook.xml';

export const WORKBOOK_RELS_PATH = 'xl/_rels/workbook.xml.rels';

export const SHARED_STRINGS_PATH = 'xl/sharedStrings.xml';

/** Relationship targets in workbook.xml.rels are resolved relative to the xl/ directory. */
export const XL_ROOT = 'xl/';

export const XML_MIME_TYPE = 'application/xml';

export const SHEET_TAG = 'sheet';

export const RELATIONSHIP_TAG = 'Relationship';

export const ROW_TAG = 'row';

export const CELL_TAG = 'c';

export const VALUE_TAG = 'v';

export const SHARED_ITEM_TAG = 'si';

export const TEXT_TAG = 't';

export const SHEET_RELATIONSHIP_ATTRIBUTE = 'r:id';

export const RELATIONSHIP_ID_ATTRIBUTE = 'Id';

export const RELATIONSHIP_TARGET_ATTRIBUTE = 'Target';

export const CELL_REFERENCE_ATTRIBUTE = 'r';

export const CELL_TYPE_ATTRIBUTE = 't';

/** Cell value is an index into sharedStrings.xml. */
export const SHARED_STRING_CELL_TYPE = 's';

/** Cell value is inline: concatenation of t elements inside is. */
export const INLINE_STRING_CELL_TYPE = 'inlineStr';

export const EMPTY_CELL = '';

/** Column letters of a cell reference like 'B3'; the row digits are not in this alphabet. */
export const COLUMN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const COLUMN_RADIX = 26;

/**
 * Excel's own last column is XFD, index 16383. A reference past it never came out of a spreadsheet,
 * and taking it at face value makes the row pad itself with billions of empty cells — the tab dies
 * by memory before the dropzone's try/catch can call the file invalid.
 */
export const MAX_XLSX_COLUMN_INDEX = 16383;

export const WORKSHEET_NOT_FOUND_MESSAGE = 'xlsx: first worksheet relationship not found';
