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
