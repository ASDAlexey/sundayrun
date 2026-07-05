import { ISO_YEAR_LENGTH } from './iso-year.constant';

/** Extracts 'YYYY' from an ISO 'YYYY-MM-DD' date string. */
export function isoYear(dateIso: string): string {
  return dateIso.slice(0, ISO_YEAR_LENGTH);
}
