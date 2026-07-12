/** A Wednesday (getDay 3) — the countdown must jump forward to the coming Sunday. */
export const WEDNESDAY_NOW = new Date('2026-07-15T10:00:00');

/** The same Sunday, once before and once after the 08:00 start. */
export const SUNDAY_BEFORE_START = new Date('2026-07-19T07:00:00');

export const SUNDAY_AFTER_START = new Date('2026-07-19T09:00:00');

/** Expected targets: the coming Sunday's slot, and a week later when today's slot has passed. */
export const NEXT_SUNDAY_START = new Date('2026-07-19T08:00:00');

export const NEXT_SUNDAY_CUSTOM_START = new Date('2026-07-19T09:30:00');

export const FOLLOWING_SUNDAY_START = new Date('2026-07-26T08:00:00');

export const START_TIME = '08:00';

export const CUSTOM_START_TIME = '09:30';

/** Malformed / out-of-range times both degrade to the 08:00 default. */
export const MALFORMED_START_TIME = 'oops';

export const OUT_OF_RANGE_START_TIME = '99:99';

/** `formatStartDate(NEXT_SUNDAY_START)` in ru-RU. */
export const EXPECTED_START_LABEL = 'воскресенье, 19 июля';

/** 1 day, 2 hours, 3 minutes, 4 seconds expressed in milliseconds. */
export const SAMPLE_REMAINING_MS = (1 * 86_400 + 2 * 3_600 + 3 * 60 + 4) * 1000;

export const SAMPLE_COUNTDOWN = { days: '01', hours: '02', minutes: '03', seconds: '04' };

export const ZERO_COUNTDOWN = { days: '00', hours: '00', minutes: '00', seconds: '00' };
