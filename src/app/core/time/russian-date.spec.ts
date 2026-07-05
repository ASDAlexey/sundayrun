import { formatRussianDateLong, formatRussianDateShort } from './russian-date';
import { FORMAT_RUSSIAN_DATE_LONG_CASES, FORMAT_RUSSIAN_DATE_SHORT_CASES, INVALID_ISO_DATE_CASES } from './russian-date.mock';

describe('russian-date', () => {
  it('formats ISO dates in long and short Russian form and throws on invalid input', () => {
    for (const [dateIso, expected] of FORMAT_RUSSIAN_DATE_LONG_CASES) {
      expect(formatRussianDateLong(dateIso), `formatRussianDateLong(${JSON.stringify(dateIso)})`).toBe(expected);
    }

    for (const [dateIso, expected] of FORMAT_RUSSIAN_DATE_SHORT_CASES) {
      expect(formatRussianDateShort(dateIso), `formatRussianDateShort(${JSON.stringify(dateIso)})`).toBe(expected);
    }

    for (const dateIso of INVALID_ISO_DATE_CASES) {
      expect(() => formatRussianDateLong(dateIso), `formatRussianDateLong(${JSON.stringify(dateIso)})`).toThrow();
      expect(() => formatRussianDateShort(dateIso), `formatRussianDateShort(${JSON.stringify(dateIso)})`).toThrow();
    }
  });
});
