import {
  CENTURY_DIVISOR,
  DATE_PAD_CHAR,
  DATE_PART_LENGTH,
  FEBRUARY,
  FEBRUARY_LEAP_LENGTH,
  FILE_NAME_DATE_PATTERN,
  FILE_NAME_ISO_DATE_PATTERN,
  FILE_NAME_RUSSIAN_DATE_PATTERN,
  FIRST_DAY,
  FIRST_MONTH,
  LEAP_CENTURY_DIVISOR,
  LEAP_YEAR_DIVISOR,
  MONTH_LENGTHS,
  RUSSIAN_MONTH_NAME_FORMS,
  TWO_DIGIT_YEAR_BASE,
  TWO_DIGIT_YEAR_LENGTH,
  YEAR_LENGTH,
} from './file-name-date.constant';
import { FileNameDateMatch } from './file-name-date.interface';

/**
 * Extracts the first date occurrence from a file name as an ISO date 'YYYY-MM-DD'.
 * Understands ISO names ('2026-06-14.xlsx', '2026_06_14.xlsx'), day-first numbers with any
 * separator ('14.06.2026', '1-6-2026', '14.06.26') and Russian month names in any case or
 * abbreviation ('14 июня 2026.xlsx', '12 апр.xlsx', '12-апреля-2026.xlsx'); a yearless
 * '14 июня.xlsx' gets the year inferred against `todayIso` (see `inferYearlessDate`).
 * The first format that matches decides — an impossible date fails outright instead of being
 * re-read as another format. Returns null when there is no match or the date is not a valid
 * calendar date (validated by pure integer math, the caller supplies the clock via `todayIso`).
 */
export function parseDateFromFileName(name: string, todayIso: string): string | null {
  const match = matchIsoDate(name) ?? matchNumericDate(name) ?? matchRussianDate(name);

  if (match === null) {
    return null;
  }

  const { day, month, year } = match;

  return year === null ? inferYearlessDate(day, month, todayIso) : toValidIsoDate(day, month, year);
}

function matchIsoDate(name: string): FileNameDateMatch | null {
  const match = FILE_NAME_ISO_DATE_PATTERN.exec(name);

  if (match === null) {
    return null;
  }

  const [, year, month, day] = match;

  return { day: Number(day), month: Number(month), year: Number(year) };
}

function matchNumericDate(name: string): FileNameDateMatch | null {
  const match = FILE_NAME_DATE_PATTERN.exec(name);

  if (match === null) {
    return null;
  }

  const [, day, month, year] = match;

  return { day: Number(day), month: Number(month), year: fullYear(year) };
}

/** A two-digit year is this century's: '14.06.26' is 2026, never 1926. */
function fullYear(year: string): number {
  return year.length === TWO_DIGIT_YEAR_LENGTH ? TWO_DIGIT_YEAR_BASE + Number(year) : Number(year);
}

/**
 * The first 'number + Russian word' pair whose word really is a month; anything else
 * ('2 круга', '5 км') is skipped, so a name carrying both a label and a date still resolves.
 */
function matchRussianDate(name: string): FileNameDateMatch | null {
  for (const [, day, monthName, year] of name.matchAll(FILE_NAME_RUSSIAN_DATE_PATTERN)) {
    const month = resolveMonth(monthName);

    if (month !== null) {
      return { day: Number(day), month, year: year === undefined ? null : Number(year) };
    }
  }

  return null;
}

/** The month whose spelling the word opens — 'апр', 'апреля' and 'апрель' all mean April; ambiguity means no month. */
function resolveMonth(word: string): number | null {
  const normalized = word.toLowerCase();
  const months = RUSSIAN_MONTH_NAME_FORMS.flatMap((forms, index) =>
    forms.some((form) => form.startsWith(normalized)) ? [index + FIRST_MONTH] : [],
  );

  return months.length === 1 ? months[0] : null;
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
