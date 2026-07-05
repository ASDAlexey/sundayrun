/** Matches H:MM:SS with an optional fractional part: '0:19:03,028', '1:02:03.5'. */
export const DURATION_FULL_PATTERN = /^(\d+):(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?$/;

/** Matches MM:SS with an optional fractional part: '19:03', '19:03,028'. */
export const DURATION_SHORT_PATTERN = /^(\d+):(\d{1,2})(?:[,.](\d{1,3}))?$/;

export const MS_IN_SECOND = 1000;

export const SECONDS_IN_MINUTE = 60;

export const MINUTES_IN_HOUR = 60;

/** Fractional part is right-padded to 3 digits: ',02' means 20 ms. */
export const FRACTION_LENGTH = 3;

/** Seconds and minutes are zero-padded to 2 digits when formatting. */
export const TIME_UNIT_LENGTH = 2;

export const PAD_CHAR = '0';
