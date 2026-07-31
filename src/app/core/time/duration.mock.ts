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

/** [label, milliseconds, expected 'm:ss,cc' string]: the fraction is always drawn, zeros included. */
export const FORMAT_RACE_TIME_CASES: readonly (readonly [string, number, string])[] = [
  ['zero', 0, '0:00,00'],
  ['a whole-second archive time reads as ,00', 1165000, '19:25,00'],
  ['hundredths keep their leading zero', 1165061, '19:25,06'],
  ['hundredths below a tenth', 1165010, '19:25,01'],
  ['rounds to the nearest hundredth', 1384181, '23:04,18'],
  ['rounds half up', 1384185, '23:04,19'],
  ['a remainder just under a second carries into the seconds', 1165999, '19:26,00'],
  ['carries across the minute boundary', 1199999, '20:00,00'],
  ['just below one hour', 3599994, '59:59,99'],
  ['carries across the hour boundary', 3599999, '1:00:00,00'],
  ['h:mm:ss,cc zero-pads minutes and seconds', 3723020, '1:02:03,02'],
  ['fractional input (an average pace) rounds too', 277036.2, '4:37,04'],
];

/** [label, integer milliseconds, expected lossless string]; every case must survive `parseDuration`. */
export const FORMAT_DURATION_PRECISE_CASES: readonly (readonly [string, number, string])[] = [
  ['zero', 0, '0:00,000'],
  ['milliseconds keep their leading zeros', 7, '0:00,007'],
  ['tens of milliseconds keep one leading zero', 20, '0:00,020'],
  ['whole seconds still get a fraction', 60000, '1:00,000'],
  ['m:ss,mmm', 1143028, '19:03,028'],
  ['just below one hour', 3599999, '59:59,999'],
  ['exactly one hour', 3600000, '1:00:00,000'],
  ['h:mm:ss,mmm zero-pads minutes and seconds', 3723028, '1:02:03,028'],
  ['multi-hour', 36610500, '10:10:10,500'],
];

/** [label, fractional milliseconds (an average), expected string]: rounded to whole milliseconds first. */
export const FORMAT_DURATION_PRECISE_ROUNDING_CASES: readonly (readonly [string, number, string])[] = [
  ['rounds half up', 1143027.5, '19:03,028'],
  ['rounds down', 1143027.4, '19:03,027'],
];
