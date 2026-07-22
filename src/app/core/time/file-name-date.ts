import {
  CENTURY_DIVISOR,
  DATE_PAD_CHAR,
  DATE_PART_LENGTH,
  FEBRUARY,
  FEBRUARY_LEAP_LENGTH,
  FILE_NAME_DATE_PATTERN,
  FILE_NAME_RUSSIAN_DATE_PATTERN,
  FIRST_DAY,
  FIRST_MONTH,
  LEAP_CENTURY_DIVISOR,
  LEAP_YEAR_DIVISOR,
  MONTH_LENGTHS,
  YEAR_LENGTH,
} from './file-name-date.constant';
import { RUSSIAN_MONTHS_GENITIVE } from './russian-date.constant';

/**
 * Extracts the first date occurrence from a file name as an ISO date 'YYYY-MM-DD'.
 * Understands '14.06.2026.xlsx' and Russian '14 июня 2026.xlsx'; a yearless
 * '14 июня.xlsx' gets the year inferred against `todayIso` (see `inferYearlessDate`).
 * Returns null when there is no match or the date is not a valid calendar date
 * (validated by pure integer math, the caller supplies the clock via `todayIso`).
 */
export function parseDateFromFileName(name: string, todayIso: string): string | null {
  return parseNumericDate(name) ?? parseRussianDate(name, todayIso);
}

function parseNumericDate(name: string): string | null {
  const match = FILE_NAME_DATE_PATTERN.exec(name);

  if (match === null) {
    return null;
  }

  const [, day, month, year] = match;

  return toValidIsoDate(Number(day), Number(month), Number(year));
}

function parseRussianDate(name: string, todayIso: string): string | null {
  const match = FILE_NAME_RUSSIAN_DATE_PATTERN.exec(name);

  if (match === null) {
    return null;
  }

  const [, day, monthName, year] = match;
  const month = RUSSIAN_MONTHS_GENITIVE.indexOf(monthName.toLowerCase()) + FIRST_MONTH;

  if (year !== undefined) {
    return toValidIsoDate(Number(day), month, Number(year));
  }

  return inferYearlessDate(Number(day), month, todayIso);
}

/**
 * A yearless file name refers to a race already run: the current year wins unless it puts the
 * date in the future (a December protocol uploaded in January), then the previous year is used.
 */
function inferYearlessDate(day: number, month: number, todayIso: string): string | null {
  const currentYear = Number(todayIso.slice(0, YEAR_LENGTH));
  const candidate = toValidIsoDate(day, month, currentYear);

  if (candidate !== null && candidate <= todayIso) {
    return candidate;
  }

  return toValidIsoDate(day, month, currentYear - 1);
}

function toValidIsoDate(day: number, month: number, year: number): string | null {
  if (!isValidCalendarDate(day, month, year)) {
    return null;
  }

  const paddedMonth = String(month).padStart(DATE_PART_LENGTH, DATE_PAD_CHAR);
  const paddedDay = String(day).padStart(DATE_PART_LENGTH, DATE_PAD_CHAR);

  return `${year}-${paddedMonth}-${paddedDay}`;
}

function isValidCalendarDate(day: number, month: number, year: number): boolean {
  if (month < FIRST_MONTH || month > MONTH_LENGTHS.length) {
    return false;
  }

  return day >= FIRST_DAY && day <= monthLength(month, year);
}

function monthLength(month: number, year: number): number {
  if (month === FEBRUARY && isLeapYear(year)) {
    return FEBRUARY_LEAP_LENGTH;
  }

  return MONTH_LENGTHS[month - FIRST_MONTH];
}

function isLeapYear(year: number): boolean {
  return year % LEAP_YEAR_DIVISOR === 0 && (year % CENTURY_DIVISOR !== 0 || year % LEAP_CENTURY_DIVISOR === 0);
}
