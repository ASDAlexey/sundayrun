/** Matches H:MM:SS with an optional fractional part: '0:19:03,028', '1:02:03.5'. */
export const DURATION_FULL_PATTERN = /^(\d+):(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?$/;

/** Matches MM:SS with an optional fractional part: '19:03', '19:03,028'. */
export const DURATION_SHORT_PATTERN = /^(\d+):(\d{1,2})(?:[,.](\d{1,3}))?$/;

export const MS_IN_SECOND = 1000;

/** The finest unit any screen shows: every result is drawn to hundredths, the journal keeps the rest. */
export const MS_IN_HUNDREDTH = 10;

export const SECONDS_IN_MINUTE = 60;

export const MINUTES_IN_HOUR = 60;

export const HUNDREDTHS_IN_SECOND = 100;

/** Fractional part is right-padded to 3 digits: ',02' means 20 ms. */
export const FRACTION_LENGTH = 3;

/** Race results draw exactly two fractional digits: '19:25,06'. */
export const HUNDREDTHS_LENGTH = 2;

/** Seconds and minutes are zero-padded to 2 digits when formatting. */
export const TIME_UNIT_LENGTH = 2;

export const PAD_CHAR = '0';

/** Separator before the fractional part when formatting; the timer exports use a comma. */
export const FRACTION_SEPARATOR = ',';

/** The floor every formatter clamps to: a length of time has no negative form. */
export const NO_ELAPSED_MS = 0;

/**
 * A finished clock with its hundredths trailing it, wherever it sits in a text: 'm:ss,cc', the tail
 * of 'h:mm:ss,cc', and the times inside a sentence — «ЛР (было 23:05,00)», '23:05,00 → 22:50,00'.
 * Capture 1 is the clock that qualifies the match, capture 2 the fraction. Global: one value may
 * carry several times. Shared by the two ways a reader's «без сотых» is honoured — folding the
 * fraction away in the DOM (`app-race-time`) and cutting it out of a string (`withoutHundredths`).
 */
export const RACE_TIME_FRACTION_PATTERN = /(\d{1,2}:\d{2})(,\d{2})/g;

/** Keeps the clock, drops the fraction that followed it. */
export const FRACTION_STRIPPED_REPLACEMENT = '$1';
