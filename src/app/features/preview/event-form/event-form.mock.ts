import { RaceEvent } from '../../../core/models/race-event.interface';
import { RACE_EVENT_DEFAULTS } from '../race-event-defaults.constant';

export const SUGGESTED_DATE_ISO = '2026-06-14';

/** Fractional on purpose: the club numbers runs as season.run (2.73), the form must accept it. */
export const VALID_EVENT_NUMBER = 2.73;

export const BELOW_MIN_EVENT_NUMBER = 0;

/** The event the form must push once every control is valid. */
export const VALID_RACE_EVENT: RaceEvent = { number: VALID_EVENT_NUMBER, dateIso: SUGGESTED_DATE_ISO, ...RACE_EVENT_DEFAULTS };
