/** Fixed 'today' for the yearless Russian names; a Saturday in mid-2026. */
export const PARSE_DATE_TODAY_ISO = '2026-06-20';

/** [file name, expected ISO date or null] against `PARSE_DATE_TODAY_ISO`. */
export const PARSE_DATE_FROM_FILE_NAME_CASES: readonly (readonly [string, string | null])[] = [
  // plain timer export names
  ['14.06.2026.xlsx', '2026-06-14'],
  ['24.05.2026.xlsx', '2026-05-24'],
  // the date may appear anywhere in the name; the first occurrence wins
  ['Забег 05.01.2024 итог.xlsx', '2024-01-05'],
  ['export-31.12.2026', '2026-12-31'],
  ['01.02.2025 и 03.04.2025.xlsx', '2025-02-01'],
  // leap-year rules: /4 yes, /100 no, /400 yes
  ['29.02.2024.xlsx', '2024-02-29'],
  ['29.02.2026.xlsx', null],
  ['29.02.2000.xlsx', '2000-02-29'],
  ['29.02.1900.xlsx', null],
  ['28.02.1900.xlsx', '1900-02-28'],
  // invalid calendar dates
  ['32.13.2026.xlsx', null],
  ['32.01.2026.xlsx', null],
  ['31.04.2026.xlsx', null],
  ['00.06.2026.xlsx', null],
  ['14.00.2026.xlsx', null],
  ['14.13.2026.xlsx', null],
  // Russian names with an explicit year
  ['14 июня 2026.xlsx', '2026-06-14'],
  ['Забег 5 января 2024 итог.xlsx', '2024-01-05'],
  ['29 февраля 2026.xlsx', null],
  // yearless Russian names: past-or-today keeps the current year…
  ['1 марта.xlsx', '2026-03-01'],
  ['1 Марта.xlsx', '2026-03-01'],
  ['20 июня.xlsx', '2026-06-20'],
  // …a future date rolls back to the previous year
  ['25 декабря.xlsx', '2025-12-25'],
  ['21 июня.xlsx', '2025-06-21'],
  // 29 февраля is invalid in both candidate years around mid-2026
  ['29 февраля.xlsx', null],
  ['32 марта.xlsx', null],
  // no date match at all
  ['results.xlsx', null],
  ['1.6.2026.xlsx', null],
  ['14-06-2026.xlsx', null],
  ['', null],
];
