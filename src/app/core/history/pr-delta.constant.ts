/** Leads a result slower than the record it was chasing: «+0:31». */
export const PR_DELTA_SLOWER_PREFIX = '+';

/**
 * Leads a result that beat the record: «−0:21». A typographic minus, not a hyphen — it has to
 * sit at the same height and width as the plus it alternates with in a column of mono times.
 */
export const PR_DELTA_FASTER_PREFIX = '−';

/** The exact repeat of the record carries no sign; the bare '0:00,00' says it on its own. */
export const PR_DELTA_EQUAL_PREFIX = '';

/** Joins the two facts of the «Δ ЛР» hint: 'ЛР 19:46,00 · 12 янв 2025 · лучшее в 2026 — 20:05,00'. */
export const PR_DELTA_HINT_SEPARATOR = ' · ';
