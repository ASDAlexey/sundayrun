import { ISO_YEAR_LENGTH, ISO_YEAR_START_SUFFIX } from './iso-year.constant';

/** Extracts 'YYYY' from an ISO 'YYYY-MM-DD' date string. */
export function isoYear(dateIso: string): string {
  return dateIso.slice(0, ISO_YEAR_LENGTH);
}

/** The first day of the date's own year: '2026-08-16' → '2026-01-01'. */
export function isoYearStart(dateIso: string): string {
  return isoYear(dateIso) + ISO_YEAR_START_SUFFIX;
}
