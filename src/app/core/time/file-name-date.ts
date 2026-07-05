import {
  CENTURY_DIVISOR,
  FEBRUARY,
  FEBRUARY_LEAP_LENGTH,
  FILE_NAME_DATE_PATTERN,
  FIRST_DAY,
  FIRST_MONTH,
  LEAP_CENTURY_DIVISOR,
  LEAP_YEAR_DIVISOR,
  MONTH_LENGTHS,
} from './file-name-date.constant';

/**
 * Extracts the first DD.MM.YYYY occurrence from a file name ('14.06.2026.xlsx')
 * as an ISO date 'YYYY-MM-DD'. Returns null when there is no match or the date
 * is not a valid calendar date (validated by pure integer math, no system clock).
 */
export function parseDateFromFileName(name: string): string | null {
  const match = FILE_NAME_DATE_PATTERN.exec(name);

  if (match === null) {
    return null;
  }

  const [, day, month, year] = match;

  return isValidCalendarDate(Number(day), Number(month), Number(year)) ? `${year}-${month}-${day}` : null;
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
