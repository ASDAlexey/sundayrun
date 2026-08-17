/** Leads a result slower than whatever it was measured against: «+0:31». */
export const DELTA_SLOWER_PREFIX = '+';

/**
 * Leads a result that beat it: «−0:21». A typographic minus, not a hyphen — it has to sit at the
 * same height and width as the plus it alternates with in a column of mono times.
 */
export const DELTA_FASTER_PREFIX = '−';

/** The exact repeat carries no sign; the bare '0:00,00' says it on its own. */
export const DELTA_EQUAL_PREFIX = '';
