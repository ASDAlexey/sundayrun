import {
  DURATION_FULL_PATTERN,
  DURATION_SHORT_PATTERN,
  FRACTION_LENGTH,
  FRACTION_SEPARATOR,
  HUNDREDTHS_IN_SECOND,
  HUNDREDTHS_LENGTH,
  MINUTES_IN_HOUR,
  MS_IN_HUNDREDTH,
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

/**
 * Formats integer milliseconds as 'm:ss' or 'h:mm:ss' (>= 1 hour), rounding to the nearest second
 * first. The whole-second form of a clock that ticks on its own — a stopwatch counting a publish
 * out, a «прошло столько-то» line. Anything a stopwatch measured on the course is a race time and
 * belongs in `formatRaceTime`.
 */
export function formatDuration(ms: number): string {
  return clockText(Math.round(ms / MS_IN_SECOND));
}

/**
 * Formats milliseconds as 'm:ss,cc' or 'h:mm:ss,cc' (>= 1 hour) — the form every measured result
 * is drawn in: finish times, splits, paces, medians, the gap to the next place.
 *
 * The hundredths are always printed, zeros included. Most of the archive was written down to whole
 * seconds and can only ever read ',00', but a column that dropped the fraction on those rows and
 * kept it on the timed ones would read as two different units stacked on top of each other.
 *
 * The remainder below a hundredth rounds to the nearest one and carries, so 19:25.999 reads
 * '19:26,00' rather than '19:25,100'.
 */
export function formatRaceTime(ms: number): string {
  const totalHundredths = Math.round(ms / MS_IN_HUNDREDTH);
  const hundredths = totalHundredths % HUNDREDTHS_IN_SECOND;
  const totalSeconds = (totalHundredths - hundredths) / HUNDREDTHS_IN_SECOND;
  const paddedHundredths = String(hundredths).padStart(HUNDREDTHS_LENGTH, PAD_CHAR);

  return `${clockText(totalSeconds)}${FRACTION_SEPARATOR}${paddedHundredths}`;
}

/** 'm:ss', growing an hours part only once there is one: '1:02:03'. */
function clockText(totalSeconds: number): string {
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

/**
 * Formats milliseconds as 'm:ss,mmm' or 'h:mm:ss,mmm' (>= 1 hour), keeping every millisecond.
 * The result is exactly what `parseDuration` reads back, so it is the lossless form used by
 * the xlsx export; fractional input is rounded to whole milliseconds first.
 */
export function formatDurationPrecise(ms: number): string {
  const totalMs = Math.round(ms);
  const milliseconds = totalMs % MS_IN_SECOND;
  const totalSeconds = (totalMs - milliseconds) / MS_IN_SECOND;
  const paddedMilliseconds = String(milliseconds).padStart(FRACTION_LENGTH, PAD_CHAR);

  return `${clockText(totalSeconds)}${FRACTION_SEPARATOR}${paddedMilliseconds}`;
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
