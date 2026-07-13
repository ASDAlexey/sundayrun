import { CountdownParts } from './next-start.interface';
import {
  COUNTDOWN_PAD_CHAR,
  COUNTDOWN_PAD_LENGTH,
  DEFAULT_START_HOURS,
  DEFAULT_START_MINUTES,
  MAX_HOURS,
  MAX_MINUTES,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  REGISTRATION_LEAD_MINUTES,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  START_DATE_FORMAT,
  START_TIME_PATTERN,
  START_WEEKDAY,
} from './next-start.constant';

/** `HH:MM` → `[hours, minutes]`, falling back to the default slot on anything malformed. */
function parseStartTime(startTime: string): [number, number] {
  const match = START_TIME_PATTERN.exec(startTime.trim());

  if (match !== null) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours <= MAX_HOURS && minutes <= MAX_MINUTES) {
      return [hours, minutes];
    }
  }

  return [DEFAULT_START_HOURS, DEFAULT_START_MINUTES];
}

/** The stored `HH:MM` normalised for display — '08:00' reads as «8:00»; malformed input shows the default slot. */
export function formatStartTimeLabel(startTime: string): string {
  const [hours, minutes] = parseStartTime(startTime);

  return formatTimeOfDay(hours, minutes);
}

/** Registration opens 15 minutes before the start — «9:00» → «8:45». */
export function registrationTimeLabel(startTime: string): string {
  const [hours, minutes] = parseStartTime(startTime);
  const total = (hours * MINUTES_PER_HOUR + minutes - REGISTRATION_LEAD_MINUTES + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  return formatTimeOfDay(Math.floor(total / MINUTES_PER_HOUR), total % MINUTES_PER_HOUR);
}

/** «9:05» — hours without a leading zero, minutes always two digits. */
function formatTimeOfDay(hours: number, minutes: number): string {
  return `${hours}:${pad(minutes)}`;
}

/** The next Sunday at `startTime` strictly after `now` — today counts only if its slot is still ahead. */
export function nextStartAt(now: Date, startTime: string): Date {
  const [hours, minutes] = parseStartTime(startTime);
  const target = new Date(now);

  target.setHours(hours, minutes, 0, 0);
  target.setDate(now.getDate() + ((START_WEEKDAY - now.getDay() + 7) % 7));

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 7);
  }

  return target;
}

/** Splits the remaining milliseconds into two-digit day/hour/minute/second parts; never negative. */
export function formatCountdown(remainingMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  return {
    days: pad(Math.floor(totalSeconds / SECONDS_PER_DAY)),
    hours: pad(Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR)),
    minutes: pad(Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)),
    seconds: pad(totalSeconds % SECONDS_PER_MINUTE),
  };
}

/** Two-digit zero-padded string for a countdown unit. */
function pad(value: number): string {
  return String(value).padStart(COUNTDOWN_PAD_LENGTH, COUNTDOWN_PAD_CHAR);
}

/** "воскресенье, 19 июля" for the card's date line. */
export function formatStartDate(date: Date): string {
  return START_DATE_FORMAT.format(date);
}
