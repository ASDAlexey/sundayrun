import { ISO_MONTH_END, ISO_MONTH_START, MONTH_SEASONS } from './seasons.constant';
import { SeasonType } from './seasons.enum';

/** The calendar-year season of an ISO 'YYYY-MM-DD' date. */
export function seasonOfIso(dateIso: string): SeasonType {
  return MONTH_SEASONS[dateIso.slice(ISO_MONTH_START, ISO_MONTH_END)];
}
