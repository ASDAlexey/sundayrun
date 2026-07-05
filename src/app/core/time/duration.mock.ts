/** [raw input, expected integer milliseconds or null when invalid]. */
export const PARSE_DURATION_CASES: readonly (readonly [string, number | null])[] = [
  // H:MM:SS,mmm from real timer exports
  ['0:19:03,028', 1143028],
  ['1:02:03,5', 3723500],
  ['0:19:03.028', 1143028],
  // fractional part is right-padded to 3 digits: ',02' → 20 ms
  ['0:19:03,02', 1143020],
  // H:MM:SS without fraction
  ['1:02:03', 3723000],
  // MM:SS variants
  ['19:03', 1143000],
  ['19:03,028', 1143028],
  ['19:3.5', 1143500],
  ['119:03', 7143000],
  // input is trimmed
  ['  19:03  ', 1143000],
  // garbage / empty
  ['', null],
  ['   ', null],
  ['abc', null],
  ['19', null],
  ['19:', null],
  [':03', null],
  ['19:035', null],
  ['0:19:03,0284', null],
  ['1:02:03:04', null],
  ['-19:03', null],
  ['19:03,', null],
];

/** [integer milliseconds, expected display string]. */
export const FORMAT_DURATION_CASES: readonly (readonly [string, number, string])[] = [
  ['zero', 0, '0:00'],
  ['rounds down', 1143028, '19:03'],
  ['rounds half up', 1143500, '19:04'],
  ['59.5 s rounds to the next minute boundary', 59500, '1:00'],
  ['23:59,499 stays below the boundary', 1439499, '23:59'],
  ['23:59,5 rounds to 24:00', 1439500, '24:00'],
  ['just below one hour', 3599499, '59:59'],
  ['rounds up across the hour boundary', 3599500, '1:00:00'],
  ['exactly one hour', 3600000, '1:00:00'],
  ['h:mm:ss zero-pads minutes and seconds', 3723000, '1:02:03'],
  ['multi-hour', 36610000, '10:10:10'],
];
