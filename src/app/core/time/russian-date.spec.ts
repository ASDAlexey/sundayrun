import { formatRussianDateChip, formatRussianDateCompact, formatRussianDateLong, formatRussianDateShort } from './russian-date';
import {
  FORMAT_RUSSIAN_DATE_CHIP_CASES,
  FORMAT_RUSSIAN_DATE_COMPACT_CASES,
  FORMAT_RUSSIAN_DATE_LONG_CASES,
  FORMAT_RUSSIAN_DATE_SHORT_CASES,
  INVALID_ISO_DATE_CASES,
} from './russian-date.mock';

describe('russian-date', () => {
  it('formats ISO dates in long, short, compact and chip Russian form and throws on invalid input', () => {
    for (const [dateIso, expected] of FORMAT_RUSSIAN_DATE_LONG_CASES) {
      expect(formatRussianDateLong(dateIso), `formatRussianDateLong(${JSON.stringify(dateIso)})`).toBe(expected);
    }

    for (const [dateIso, expected] of FORMAT_RUSSIAN_DATE_SHORT_CASES) {
      expect(formatRussianDateShort(dateIso), `formatRussianDateShort(${JSON.stringify(dateIso)})`).toBe(expected);
    }

    for (const [dateIso, expected] of FORMAT_RUSSIAN_DATE_COMPACT_CASES) {
      expect(formatRussianDateCompact(dateIso), `formatRussianDateCompact(${JSON.stringify(dateIso)})`).toBe(expected);
    }

    for (const [dateIso, expected] of FORMAT_RUSSIAN_DATE_CHIP_CASES) {
      expect(formatRussianDateChip(dateIso), `formatRussianDateChip(${JSON.stringify(dateIso)})`).toBe(expected);
    }

    for (const dateIso of INVALID_ISO_DATE_CASES) {
      expect(() => formatRussianDateLong(dateIso), `formatRussianDateLong(${JSON.stringify(dateIso)})`).toThrow();
      expect(() => formatRussianDateShort(dateIso), `formatRussianDateShort(${JSON.stringify(dateIso)})`).toThrow();
      expect(() => formatRussianDateCompact(dateIso), `formatRussianDateCompact(${JSON.stringify(dateIso)})`).toThrow();
      expect(() => formatRussianDateChip(dateIso), `formatRussianDateChip(${JSON.stringify(dateIso)})`).toThrow();
    }
  });
});
