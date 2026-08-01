import { formatDuration, formatDurationPrecise, formatRaceTime, parseDuration } from './duration';
import { MS_IN_HUNDREDTH } from './duration.constant';
import {
  FORMAT_DURATION_CASES,
  FORMAT_DURATION_PRECISE_CASES,
  FORMAT_DURATION_PRECISE_ROUNDING_CASES,
  FORMAT_RACE_TIME_CASES,
  NEGATIVE_MS_CASES,
  PARSE_DURATION_CASES,
  ZERO_DURATION_TEXT,
  ZERO_PRECISE_TEXT,
  ZERO_RACE_TIME_TEXT,
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

  it('formats milliseconds as m:ss,cc with the hundredths always drawn, and parseDuration reads them back', () => {
    for (const [label, ms, expected] of FORMAT_RACE_TIME_CASES) {
      expect(formatRaceTime(ms), `formatRaceTime(${ms}) — ${label}`).toBe(expected);
      expect(parseDuration(expected), `parseDuration(${expected}) — ${label}`).toBe(Math.round(ms / MS_IN_HUNDREDTH) * MS_IN_HUNDREDTH);
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

  it('clamps a negative duration to zero rather than drawing a signed remainder', () => {
    for (const ms of NEGATIVE_MS_CASES) {
      expect(formatDuration(ms), `formatDuration(${ms})`).toBe(ZERO_DURATION_TEXT);
      expect(formatRaceTime(ms), `formatRaceTime(${ms})`).toBe(ZERO_RACE_TIME_TEXT);
      expect(formatDurationPrecise(ms), `formatDurationPrecise(${ms})`).toBe(ZERO_PRECISE_TEXT);
    }
  });
});
