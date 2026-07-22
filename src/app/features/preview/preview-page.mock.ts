/** Participants whose gender is still unresolved in the warning-strip scenario. */
export const UNVERIFIED_COUNT = 2;

export const HISTORY_LOAD_ERROR_MESSAGE = 'history unavailable';

/** `eventDatesFromHistory(VALID_HISTORY)` — the sole participation slug. */
export const EXPECTED_PUBLISHED_DATES = ['2026-06-21'];

/** A three-file drop for the batch-warnings scenario. */
export const BATCH_DRAFT_COUNT = 3;

/** Two drafts unready, the active (first) one among them. */
export const ACTIVE_UNREADY_READINESS = [false, true, false];

/** Still two unready drafts, but the active one is done. */
export const ACTIVE_READY_READINESS = [true, false, false];

export const BATCH_UNREADY_COUNT = 2;

/** The active draft's own warnings already cover it, so the batch warning counts one less. */
export const EXPECTED_OTHER_UNREADY_WHEN_ACTIVE_UNREADY = 1;

/** A ready active draft leaves every unready sibling counted. */
export const EXPECTED_OTHER_UNREADY_WHEN_ACTIVE_READY = 2;

/** `.preview__warning` strips of the batch scenario: unverified genders, unready siblings, duplicate dates. */
export const EXPECTED_BATCH_WARNING_COUNT = 3;
