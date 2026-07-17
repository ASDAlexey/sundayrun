/** Start time used when the organiser has not set one — the program's default Sunday slot. */
export const DEFAULT_START_TIME = '08:00';

/** The default slot as numbers, used when a stored `startTime` is missing or malformed. */
export const DEFAULT_START_HOURS = 8;

export const DEFAULT_START_MINUTES = 0;

/** Upper bounds a valid `HH:MM` must respect. */
export const MAX_HOURS = 23;

export const MAX_MINUTES = 59;

/** The run always starts on Sunday (`Date.getDay()` numbering, where Sunday is 0). */
export const START_WEEKDAY = 0;

/** A week's stride in days — used to hop to the next Sunday. */
export const DAYS_PER_WEEK = 7;

/** Registration opens this many minutes before the start. */
export const REGISTRATION_LEAD_MINUTES = 15;

export const MINUTES_PER_HOUR = 60;

export const MINUTES_PER_DAY = 1440;

/** The live countdown refreshes once a second. */
export const COUNTDOWN_TICK_MS = 1000;

/** Every countdown unit reads as two digits — '06', not '6'. */
export const COUNTDOWN_PAD_LENGTH = 2;

export const COUNTDOWN_PAD_CHAR = '0';

/** Accepts `HH:MM` / `H:MM`; captures hours and minutes for validation. */
export const START_TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

/** "воскресенье, 19 июля" — weekday plus day and month, the way the card reads. */
export const START_DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

/** Seconds in a day / hour / minute — the divisors the countdown breakdown uses. */
export const SECONDS_PER_DAY = 86_400;

export const SECONDS_PER_HOUR = 3_600;

export const SECONDS_PER_MINUTE = 60;
