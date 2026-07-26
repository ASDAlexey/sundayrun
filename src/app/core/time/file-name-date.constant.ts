import {
  RUSSIAN_MONTHS_GENITIVE,
  RUSSIAN_MONTHS_NOMINATIVE,
  RUSSIAN_MONTHS_PREPOSITIONAL,
  RUSSIAN_MONTHS_SHORT,
} from './russian-date.constant';

/**
 * YYYY-MM-DD anywhere in a file name, dot and underscore separators included ('2026-06-14', '2026.06.14').
 * Tried first: a four-digit head is what tells this format from the day-first one.
 */
export const FILE_NAME_ISO_DATE_PATTERN = /(?<!\d)(\d{4})[./_-](\d{1,2})[./_-](\d{1,2})(?!\d)/;

/**
 * D.M.YYYY anywhere in a file name, with any of the separators a timer export or a phone gallery
 * produces ('14.06.2026', '1-6-2026', '14_06_26'). The digit lookarounds keep the pattern off a
 * longer number — the tail of an ISO date included.
 */
export const FILE_NAME_DATE_PATTERN = /(?<!\d)(\d{1,2})[./_-](\d{1,2})[./_-](\d{4}|\d{2})(?!\d)/;

/**
 * 'D месяц' with an optional year anywhere in a file name: '1 марта', '12 апр.', '12-апреля-2026'.
 * The month word is captured loosely and resolved against every case and abbreviation in code, so
 * a name that merely reads like a date ('2 круга') falls through to the next candidate.
 */
export const FILE_NAME_RUSSIAN_DATE_PATTERN = /(?<!\d)(\d{1,2})[\s._-]*([а-яё]{3,})\.?(?:[\s._-]*(\d{4}))?/giu;

/** Month spellings a file name may use, indexed by `month - 1`: genitive, nominative, prepositional, abbreviation. */
export const RUSSIAN_MONTH_NAME_FORMS: readonly (readonly string[])[] = RUSSIAN_MONTHS_GENITIVE.map((genitive, index) => [
  genitive,
  RUSSIAN_MONTHS_NOMINATIVE[index],
  RUSSIAN_MONTHS_PREPOSITIONAL[index],
  RUSSIAN_MONTHS_SHORT[index],
]);

/** '26' in '14.06.26' means 2026: the archive starts in this century and no protocol is dated ahead of it. */
export const TWO_DIGIT_YEAR_BASE = 2000;

export const TWO_DIGIT_YEAR_LENGTH = 2;

export const DATE_PART_LENGTH = 2;

export const DATE_PAD_CHAR = '0';

export const YEAR_LENGTH = 4;

/** Day counts for months 1..12 in a non-leap year. */
export const MONTH_LENGTHS: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const FIRST_MONTH = 1;

export const FIRST_DAY = 1;

export const FEBRUARY = 2;

export const FEBRUARY_LEAP_LENGTH = 29;

export const LEAP_YEAR_DIVISOR = 4;

export const CENTURY_DIVISOR = 100;

export const LEAP_CENTURY_DIVISOR = 400;
