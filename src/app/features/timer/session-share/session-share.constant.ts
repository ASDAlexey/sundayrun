/** The workbook the sheet hands over — the same six-column format `/upload` reads back. */
export const TIMER_SHARE_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** `aria-labelledby` of the sheet points at its own heading. */
export const TIMER_SHARE_TITLE_ID = 'timer-share-title';

/** How long «Скопировано» stays under the key before the label goes back to what it does. */
export const TIMER_SHARE_COPIED_MS = 2_400;

/** A published measurement carries a slug; without one the message links to the site itself. */
export const TIMER_SHARE_RACE_PREFIX = '/races/';

/** The mark over «Скопировать», and the tick that replaces it once the clipboard took the text. */
export const TIMER_SHARE_COPY_MARK = '⧉';
export const TIMER_SHARE_COPIED_MARK = '✓';
