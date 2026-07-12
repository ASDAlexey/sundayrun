import { ISO_DATE_LENGTH } from '../history/notables.constant';

/** Today as 'YYYY-MM-DD' (UTC) — the reference point that keeps the current month open for `monthFinalSlugs`. */
export function isoToday(): string {
  return new Date().toISOString().slice(0, ISO_DATE_LENGTH);
}
