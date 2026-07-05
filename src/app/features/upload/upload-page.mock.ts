/** Payload content is irrelevant to the page: the store is mocked in the spec. */
export const FILE_BYTES = new Uint8Array([80, 75, 3, 4]);

export const DATED_FILE_NAME = '14.06.2026.xlsx';

export const SECOND_FILE_NAME = 'second.xlsx';

/** The extension check is case-insensitive. */
export const UPPER_CASE_FILE_NAME = 'РЕЗУЛЬТАТЫ.XLSX';

export const WRONG_EXTENSION_FILE_NAME = 'results.txt';

/** A key that must not activate the drop zone. */
export const OTHER_KEY = 'Escape';

export const IMPORT_FAILURE = new Error('unreadable xlsx');
