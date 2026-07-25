import { formatDuration, formatDurationPrecise, parseDuration } from './duration';
import {
  FORMAT_DURATION_CASES,
  FORMAT_DURATION_PRECISE_CASES,
  FORMAT_DURATION_PRECISE_ROUNDING_CASES,
  PARSE_DURATION_CASES,
} from './duration.mock';

describe('duration', () => {
  it('parses H:MM:SS[,mmm] and MM:SS[,mmm] into integer milliseconds and rejects invalid input', () => {
    for (const [raw, expectedMs] of PARSE_DURATION_CASES) {
      expect(parseDuration(raw), `parseDuration(${JSON.stringify(raw)})`).toBe(expectedMs);
    }
  });

  it('formats milliseconds as m:ss or h:mm:ss, rounding to the nearest second first', () => {
    for (const [label, ms, expected] of FORMAT_DURATION_CASES) {
      expect(formatDuration(ms), `formatDuration(${ms}) — ${label}`).toBe(expected);
    }
  });

  it('formats milliseconds losslessly as m:ss,mmm or h:mm:ss,mmm, rounding fractional input, and parseDuration reads it back', () => {
    for (const [label, ms, expected] of FORMAT_DURATION_PRECISE_CASES) {
      expect(formatDurationPrecise(ms), `formatDurationPrecise(${ms}) — ${label}`).toBe(expected);
      expect(parseDuration(expected), `parseDuration(${expected}) — ${label}`).toBe(ms);
    }

    for (const [label, ms, expected] of FORMAT_DURATION_PRECISE_ROUNDING_CASES) {
      expect(formatDurationPrecise(ms), `formatDurationPrecise(${ms}) — ${label}`).toBe(expected);
    }
  });
});
