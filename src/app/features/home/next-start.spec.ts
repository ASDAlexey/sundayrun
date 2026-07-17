import {
  formatCountdown,
  formatStartDate,
  formatStartTimeLabel,
  isLastSundayOfMonth,
  nextStartAt,
  registrationTimeLabel,
} from './next-start';
import {
  CUSTOM_START_TIME,
  EXPECTED_CUSTOM_REGISTRATION_LABEL,
  EXPECTED_DEFAULT_REGISTRATION_LABEL,
  EXPECTED_MIDNIGHT_REGISTRATION_LABEL,
  EXPECTED_START_LABEL,
  EXPECTED_START_TIME_LABEL,
  FOLLOWING_SUNDAY_START,
  MALFORMED_START_TIME,
  MIDNIGHT_START_TIME,
  NEXT_SUNDAY_CUSTOM_START,
  NEXT_SUNDAY_START,
  OUT_OF_RANGE_START_TIME,
  SAMPLE_COUNTDOWN,
  SAMPLE_REMAINING_MS,
  START_TIME,
  SUNDAY_AFTER_START,
  SUNDAY_BEFORE_START,
  WEDNESDAY_NOW,
  ZERO_COUNTDOWN,
} from './next-start.mock';

describe('next-start', () => {
  it('targets the coming Sunday at the configured time from a weekday', () => {
    expect(nextStartAt(WEDNESDAY_NOW, CUSTOM_START_TIME)).toEqual(NEXT_SUNDAY_CUSTOM_START);
  });

  it('keeps today when Sunday is still ahead, rolls a week on once the slot has passed', () => {
    expect(nextStartAt(SUNDAY_BEFORE_START, START_TIME)).toEqual(NEXT_SUNDAY_START);
    expect(nextStartAt(SUNDAY_AFTER_START, START_TIME)).toEqual(FOLLOWING_SUNDAY_START);
  });

  it('falls back to the 08:00 default on a malformed or out-of-range time', () => {
    expect(nextStartAt(WEDNESDAY_NOW, MALFORMED_START_TIME)).toEqual(NEXT_SUNDAY_START);
    expect(nextStartAt(WEDNESDAY_NOW, OUT_OF_RANGE_START_TIME)).toEqual(NEXT_SUNDAY_START);
  });

  it('breaks the remaining time into whole units and never goes negative', () => {
    expect(formatCountdown(SAMPLE_REMAINING_MS)).toEqual(SAMPLE_COUNTDOWN);
    expect(formatCountdown(-5000)).toEqual(ZERO_COUNTDOWN);
  });

  it('flags the last Sunday of the month as the «итоговый забег»', () => {
    expect(isLastSundayOfMonth(FOLLOWING_SUNDAY_START), '26 July — no later Sunday in the month').toBe(true);
    expect(isLastSundayOfMonth(NEXT_SUNDAY_START), '19 July — 26 July still follows').toBe(false);
  });

  it('labels the start date in Russian', () => {
    expect(formatStartDate(NEXT_SUNDAY_START)).toBe(EXPECTED_START_LABEL);
  });

  it('formats time labels without the leading hour zero and derives registration 15 minutes earlier', () => {
    expect(formatStartTimeLabel(START_TIME)).toBe(EXPECTED_START_TIME_LABEL);
    expect(formatStartTimeLabel(MALFORMED_START_TIME), 'malformed input shows the default slot').toBe(EXPECTED_START_TIME_LABEL);
    expect(registrationTimeLabel(CUSTOM_START_TIME)).toBe(EXPECTED_CUSTOM_REGISTRATION_LABEL);
    expect(registrationTimeLabel(MALFORMED_START_TIME)).toBe(EXPECTED_DEFAULT_REGISTRATION_LABEL);
    expect(registrationTimeLabel(MIDNIGHT_START_TIME), 'a post-midnight start wraps to the previous day').toBe(
      EXPECTED_MIDNIGHT_REGISTRATION_LABEL,
    );
  });
});
