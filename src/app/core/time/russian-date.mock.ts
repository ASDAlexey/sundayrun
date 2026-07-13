/** [ISO input, expected long form '20 сентября 2020 г.']. */
export const FORMAT_RUSSIAN_DATE_LONG_CASES: readonly (readonly [string, string])[] = [
  ['2020-09-20', '20 сентября 2020 г.'],
  // day is printed without the leading zero
  ['2026-01-05', '5 января 2026 г.'],
  ['2025-12-31', '31 декабря 2025 г.'],
];

/** [ISO input, expected short form '20.09.2020 г.']. */
export const FORMAT_RUSSIAN_DATE_SHORT_CASES: readonly (readonly [string, string])[] = [
  ['2020-09-20', '20.09.2020 г.'],
  // zero padding is preserved
  ['2026-01-05', '05.01.2026 г.'],
];

/** [ISO input, expected compact form '28 дек 2025']. */
export const FORMAT_RUSSIAN_DATE_COMPACT_CASES: readonly (readonly [string, string])[] = [
  ['2025-12-28', '28 дек 2025'],
  // day is printed without the leading zero
  ['2026-01-05', '5 янв 2026'],
];

/** [ISO input, expected date chip 'вс · 28 дек 2025']. */
export const FORMAT_RUSSIAN_DATE_CHIP_CASES: readonly (readonly [string, string])[] = [
  ['2025-12-28', 'вс · 28 дек 2025'],
  // day is printed without the leading zero; a weekday other than Sunday still resolves
  ['2026-01-05', 'пн · 5 янв 2026'],
  ['2026-07-05', 'вс · 5 июл 2026'],
];

/** [ISO input, expected prepositional month 'мае 2025']. */
export const FORMAT_RUSSIAN_MONTH_PREPOSITIONAL_CASES: readonly (readonly [string, string])[] = [
  ['2025-05-18', 'мае 2025'],
  ['2026-01-05', 'январе 2026'],
];

/** Malformed or out-of-range ISO strings that must throw. */
export const INVALID_ISO_DATE_CASES: readonly string[] = [
  '',
  '20.09.2020',
  '2020-9-20',
  '2020-00-10',
  '2020-13-10',
  '2020-05-00',
  '2020-05-32',
];
