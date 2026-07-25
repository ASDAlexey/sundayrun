import {
  FRACTION_SEPARATOR,
  MINUTES_IN_HOUR,
  MS_IN_HUNDREDTH,
  MS_IN_SECOND,
  PAD_CHAR,
  SECONDS_IN_MINUTE,
  TIME_UNIT_LENGTH,
} from '../../../core/time/duration.constant';

/**
 * The instrument figure: `MM:SS`, growing an hour field only once the race passes sixty minutes.
 *
 * The hundredths are not part of it — they come from `formatTimerFraction` and are drawn half-size
 * beside the digits, because a field that spins all race long must not compete with the two that a
 * hand at the finish line actually reads.
 *
 * Minutes stay two digits so the tabular figure never changes width while the race runs.
 */
export function formatTimerFigure(ms: number): string {
  const totalSeconds = Math.floor(ms / MS_IN_SECOND);
  const seconds = totalSeconds % SECONDS_IN_MINUTE;
  const totalMinutes = (totalSeconds - seconds) / SECONDS_IN_MINUTE;

  if (totalMinutes < MINUTES_IN_HOUR) {
    return `${padded(totalMinutes)}:${padded(seconds)}`;
  }

  const minutes = totalMinutes % MINUTES_IN_HOUR;
  const hours = (totalMinutes - minutes) / MINUTES_IN_HOUR;

  return `${hours}:${padded(minutes)}:${padded(seconds)}`;
}

/**
 * «,43» — the hundredths, separator included, so the two spans of the clock join without a gap.
 *
 * Truncated, never rounded: a stopwatch that shows a hundredth the race has not run yet is lying,
 * and the journal keeps every split to the millisecond regardless of what the screen says.
 */
export function formatTimerFraction(ms: number): string {
  const hundredths = Math.floor((ms % MS_IN_SECOND) / MS_IN_HUNDREDTH);

  return `${FRACTION_SEPARATOR}${padded(hundredths)}`;
}

function padded(value: number): string {
  return String(value).padStart(TIME_UNIT_LENGTH, PAD_CHAR);
}
