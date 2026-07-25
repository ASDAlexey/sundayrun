/**
 * Shown while the active draft has no file name — a missing draft, or a race timed by the
 * stopwatch, which has no workbook. Never visible in practice: the pager renders only for a
 * multi-draft upload, and a stopwatch import is always a batch of one.
 */
export const EMPTY_FILE_NAME = '';
