import { FIRST_DAY, FIRST_MONTH, MONTH_LENGTHS } from './file-name-date.constant';
import {
  INVALID_ISO_DATE_MESSAGE,
  ISO_DATE_PATTERN,
  LAST_DAY,
  RUSSIAN_MONTHS_GENITIVE,
  RUSSIAN_MONTHS_SHORT,
  RUSSIAN_WEEKDAYS_SHORT,
  YEAR_SUFFIX,
} from './russian-date.constant';

/** '2020-09-20' → '20 сентября 2020 г.'. Throws on an invalid ISO date. */
export function formatRussianDateLong(dateIso: string): string {
  const [year, month, day] = parseIsoDate(dateIso);

  return `${Number(day)} ${RUSSIAN_MONTHS_GENITIVE[Number(month) - FIRST_MONTH]} ${year} ${YEAR_SUFFIX}`;
}

/** '2020-09-20' → '20.09.2020 г.'. Throws on an invalid ISO date. */
export function formatRussianDateShort(dateIso: string): string {
  const [year, month, day] = parseIsoDate(dateIso);

  return `${day}.${month}.${year} ${YEAR_SUFFIX}`;
}

/** '2025-01-12' → '12 янв 2025' for the dated «ЛР (было X)» note. Throws on an invalid ISO date. */
export function formatRussianDateCompact(dateIso: string): string {
  const [year, month, day] = parseIsoDate(dateIso);

  return `${Number(day)} ${RUSSIAN_MONTHS_SHORT[Number(month) - FIRST_MONTH]} ${year}`;
}

/** '2025-12-28' → 'вс · 28 дек 2025' for the race-card date chip. Throws on an invalid ISO date. */
export function formatRussianDateChip(dateIso: string): string {
  const [year, month, day] = parseIsoDate(dateIso);
  const weekday = RUSSIAN_WEEKDAYS_SHORT[new Date(Date.UTC(Number(year), Number(month) - FIRST_MONTH, Number(day))).getUTCDay()];

  return `${weekday} · ${Number(day)} ${RUSSIAN_MONTHS_SHORT[Number(month) - FIRST_MONTH]} ${year}`;
}

/** Splits 'YYYY-MM-DD' into zero-padded string parts; pure integer range check, no Date object. */
function parseIsoDate(dateIso: string): [year: string, month: string, day: string] {
  const match = ISO_DATE_PATTERN.exec(dateIso);

  if (match === null) {
    throw new Error(`${INVALID_ISO_DATE_MESSAGE}${dateIso}`);
  }

  const [, year, month, day] = match;
  const monthNumber = Number(month);
  const dayNumber = Number(day);

  if (monthNumber < FIRST_MONTH || monthNumber > MONTH_LENGTHS.length || dayNumber < FIRST_DAY || dayNumber > LAST_DAY) {
    throw new Error(`${INVALID_ISO_DATE_MESSAGE}${dateIso}`);
  }

  return [year, month, day];
}
