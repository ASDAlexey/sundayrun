/** Russian month names in genitive case, indexed by `month - 1`. */
export const RUSSIAN_MONTHS_GENITIVE: readonly string[] = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** Strict 'YYYY-MM-DD' with capture groups for year, month and day. */
export const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Upper bound for a day of month (light range check, no leap-year math). */
export const LAST_DAY = 31;

/** Russian year suffix: '2020 г.'. */
export const YEAR_SUFFIX = 'г.';

export const INVALID_ISO_DATE_MESSAGE = 'Invalid ISO date: ';
