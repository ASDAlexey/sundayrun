/** The workbook «Экспорт в Excel» hands over — the same six-column format `/upload` reads. */
export const TIMER_EXPORT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** `sundayrun-2026-07-26.xlsx`: latin and dated, so it stays readable in a chat and sorts by itself. */
export const TIMER_EXPORT_FILE_PREFIX = 'sundayrun-';
export const TIMER_EXPORT_FILE_EXTENSION = '.xlsx';

/** `aria-labelledby` of the action sheet points at its own heading — the date of the measurement. */
export const TIMER_SESSIONS_TITLE_ID = 'timer-sessions-sheet-title';

/** An empty list, and a measurement with nothing left unnamed. */
export const TIMER_SESSIONS_NONE = 0;

/** «15 участников · 30 отсечек» — the same middot the race cards use. */
export const META_SEPARATOR = ' · ';
