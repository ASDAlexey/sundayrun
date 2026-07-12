import { RaceEvent } from '../../../core/models/race-event.interface';
import { RACE_EVENT_DEFAULTS } from '../race-event-defaults.constant';

export const SUGGESTED_DATE_ISO = '2026-06-14';

export const VALID_EVENT_NUMBER = 273;

export const BELOW_MIN_EVENT_NUMBER = 0;

/** The event the form must push once every control is valid. */
export const VALID_RACE_EVENT: RaceEvent = {
  number: VALID_EVENT_NUMBER,
  legacyNumber: null,
  dateIso: SUGGESTED_DATE_ISO,
  ...RACE_EVENT_DEFAULTS,
};

/** Three published events before `SUGGESTED_DATE_ISO` → the auto number is 1 + 3 = 4. */
export const PUBLISHED_EVENT_DATES = ['2026-05-24', '2026-05-31', '2026-06-07'];

export const EXPECTED_AUTO_NUMBER = 4;

/** One published date is later than the form date and must not be counted: 1 + 3 = 4. */
export const PUBLISHED_EVENT_DATES_WITH_FUTURE = [...PUBLISHED_EVENT_DATES, '2026-06-21'];

/** Setting the form to this date makes the fourth published date count: 1 + 4 = 5. */
export const LATER_DATE_ISO = '2026-06-28';

export const EXPECTED_AUTO_NUMBER_AFTER_DATE_CHANGE = 5;
