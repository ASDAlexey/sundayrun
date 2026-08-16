import { PreviousBest } from './previous-bests.interface';

/** The standing record every `prDelta` case is measured against — 20:00,00 flat. */
export const PR_DELTA_RECORD_MS = 1200000;

/** 31 seconds off it — the «+0:31,00» of the issue that asked for the column. */
export const PR_DELTA_SLOWER_MS = 1231000;

/** 21 seconds under it — the result that took the record. */
export const PR_DELTA_FASTER_MS = 1179000;

/**
 * One career covering every branch of the running-best scan: a debut with nothing behind it, a run
 * that lowers the record, a time tie that must stay with the earlier run, and two runs on one date
 * that have to look past each other — 18 January's slower row must not see its own faster sibling.
 */
export const PR_DELTA_CAREER: PreviousBest[] = [
  { slug: 'kuzminki-3', dateIso: '2026-01-18', timeMs: 1200000 },
  { slug: 'kuzminki-1', dateIso: '2025-12-28', timeMs: 1231000 },
  { slug: 'kuzminki-4', dateIso: '2026-01-18', timeMs: 1179000 },
  { slug: 'kuzminki-2', dateIso: '2026-01-04', timeMs: 1200000 },
  { slug: 'kuzminki-5', dateIso: '2026-01-25', timeMs: 1250000 },
];

/**
 * The record standing before each of those runs. The debut is absent; both 18 January runs answer
 * with the 4 January time; and 25 January sees the 19:39 of the 18th — the equal 20:00,00 of the
 * 18th never took the record from the 4th.
 */
export const EXPECTED_PREVIOUS_BEST_BY_SLUG: Record<string, PreviousBest> = {
  'kuzminki-2': { slug: 'kuzminki-1', dateIso: '2025-12-28', timeMs: 1231000 },
  'kuzminki-3': { slug: 'kuzminki-2', dateIso: '2026-01-04', timeMs: 1200000 },
  'kuzminki-4': { slug: 'kuzminki-2', dateIso: '2026-01-04', timeMs: 1200000 },
  'kuzminki-5': { slug: 'kuzminki-4', dateIso: '2026-01-18', timeMs: 1179000 },
};

/** The same scan bounded to each run's own year: December cannot answer for January, so the 4th
 * loses its baseline and every 2026 row falls back on 2026 alone. */
export const EXPECTED_PREVIOUS_YEAR_BEST_BY_SLUG: Record<string, PreviousBest> = {
  'kuzminki-3': { slug: 'kuzminki-2', dateIso: '2026-01-04', timeMs: 1200000 },
  'kuzminki-4': { slug: 'kuzminki-2', dateIso: '2026-01-04', timeMs: 1200000 },
  'kuzminki-5': { slug: 'kuzminki-4', dateIso: '2026-01-18', timeMs: 1179000 },
};

/** The record itself, as the hint names it. */
export const PR_DELTA_HINT_BEST: PreviousBest = { slug: 'kuzminki-1', dateIso: '2025-12-28', timeMs: 1231000 };

/** A season best set after that record — the second fact the hint carries. */
export const PR_DELTA_HINT_YEAR_BEST: PreviousBest = { slug: 'kuzminki-2', dateIso: '2026-01-04', timeMs: 1200000 };

export const EXPECTED_PR_DELTA_HINT = 'ЛР 20:31,00 · 28 дек 2025 · лучшее в 2026 — 20:00,00';

export const EXPECTED_PR_DELTA_HINT_RECORD_ONLY = 'ЛР 20:31,00 · 28 дек 2025';
