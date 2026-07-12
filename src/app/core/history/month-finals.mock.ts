/**
 * An archive slice around the 2026-06-14 «today»: May holds three races (only the latest closes
 * the month), April holds a single race, and June — the current month — is still open, so its
 * latest race must not be marked even though it is the newest one published. The slugs arrive
 * deliberately unordered — the archive index serves them newest-first, the chronology oldest-first.
 */

export const MONTH_FINALS_TODAY = '2026-06-14';

export const MONTH_FINAL_EVENT_SLUGS = ['2026-04-26', '2026-05-03', '2026-05-31', '2026-05-10', '2026-06-07'] as const;

export const EXPECTED_MONTH_FINALS = new Set(['2026-04-26', '2026-05-31']);
