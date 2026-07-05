/** [file name, expected ISO date or null]. */
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
  // no DD.MM.YYYY match at all
  ['results.xlsx', null],
  ['1.6.2026.xlsx', null],
  ['14-06-2026.xlsx', null],
  ['', null],
];
