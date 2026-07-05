/** DD.MM.YYYY anywhere in a file name, e.g. '14.06.2026.xlsx'. */
export const FILE_NAME_DATE_PATTERN = /(\d{2})\.(\d{2})\.(\d{4})/;

/** Day counts for months 1..12 in a non-leap year. */
export const MONTH_LENGTHS: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const FIRST_MONTH = 1;

export const FIRST_DAY = 1;

export const FEBRUARY = 2;

export const FEBRUARY_LEAP_LENGTH = 29;

export const LEAP_YEAR_DIVISOR = 4;

export const CENTURY_DIVISOR = 100;

export const LEAP_CENTURY_DIVISOR = 400;
