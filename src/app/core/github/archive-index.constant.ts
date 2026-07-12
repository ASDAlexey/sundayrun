export const ARCHIVE_INDEX_SCHEMA_VERSION = 1;

/**
 * The number of the oldest archived event: numbering is the plain archive position, so the
 * newest event's number always equals the total count on the home page. Numbers are never
 * entered by hand and reshuffle automatically when an event is added or removed; the numbers
 * the organisers used before (№117…296, then «2.1»…«2.72») live in `legacyNumber` and render
 * in parentheses after the positional one.
 */
export const FIRST_ARCHIVE_EVENT_NUMBER = 1;
