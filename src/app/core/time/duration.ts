import {
  DURATION_FULL_PATTERN,
  DURATION_SHORT_PATTERN,
  FRACTION_LENGTH,
  MINUTES_IN_HOUR,
  MS_IN_SECOND,
  PAD_CHAR,
  SECONDS_IN_MINUTE,
  TIME_UNIT_LENGTH,
} from './duration.constant';

/**
 * Parses 'H:MM:SS[,mmm]' or 'MM:SS[,mmm]' (comma or dot before the fractional part)
 * into integer milliseconds. Returns null for invalid or empty input.
 */
export function parseDuration(raw: string): number | null {
  const value = raw.trim();
  const fullMatch = DURATION_FULL_PATTERN.exec(value);

  if (fullMatch) {
    const [, hours, minutes, seconds, fraction] = fullMatch;

    return toMs(Number(hours) * MINUTES_IN_HOUR + Number(minutes), seconds, fraction);
  }

  const shortMatch = DURATION_SHORT_PATTERN.exec(value);

  if (shortMatch) {
    const [, minutes, seconds, fraction] = shortMatch;

    return toMs(Number(minutes), seconds, fraction);
  }

  return null;
}

/** Formats integer milliseconds as 'm:ss' or 'h:mm:ss' (>= 1 hour), rounding to the nearest second first. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / MS_IN_SECOND);
  const seconds = totalSeconds % SECONDS_IN_MINUTE;
  const totalMinutes = (totalSeconds - seconds) / SECONDS_IN_MINUTE;
  const paddedSeconds = String(seconds).padStart(TIME_UNIT_LENGTH, PAD_CHAR);

  if (totalMinutes < MINUTES_IN_HOUR) {
    return `${totalMinutes}:${paddedSeconds}`;
  }

  const minutes = totalMinutes % MINUTES_IN_HOUR;
  const hours = (totalMinutes - minutes) / MINUTES_IN_HOUR;
  const paddedMinutes = String(minutes).padStart(TIME_UNIT_LENGTH, PAD_CHAR);

  return `${hours}:${paddedMinutes}:${paddedSeconds}`;
}

function toMs(totalMinutes: number, seconds: string, fraction: string | undefined): number {
  const totalSeconds = totalMinutes * SECONDS_IN_MINUTE + Number(seconds);

  return totalSeconds * MS_IN_SECOND + parseFraction(fraction);
}

function parseFraction(fraction: string | undefined): number {
  if (fraction === undefined) {
    return 0;
  }

  return Number(fraction.padEnd(FRACTION_LENGTH, PAD_CHAR));
}
