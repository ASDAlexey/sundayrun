export const TIME_PLACEHOLDER = '{time}';

export const YEAR_PLACEHOLDER = '{year}';

/** Note for an athlete's first ever participation. */
export const FIRST_PARTICIPATION_NOTE = 'Первое участие';

/** Opening of the personal record note — the year review counts stored notes by this substring. */
export const PERSONAL_RECORD_NOTE_PREFIX = 'ЛР (было';

/** All-time personal record note; `{time}` is the previous best. */
export const PERSONAL_RECORD_NOTE_TEMPLATE = `${PERSONAL_RECORD_NOTE_PREFIX} ${TIME_PLACEHOLDER})`;

/** Best result of the year note; `{year}` is the event year. */
export const YEAR_BEST_NOTE_TEMPLATE = `Лучший результат ${YEAR_PLACEHOLDER} г.`;

export const EMPTY_NOTE = '';

/** Joins the tokens of a combined note, matching the historical protocols: 'ЛР (было X); Лучший результат YYYY г.'. */
export const NOTE_SEPARATOR = '; ';

/** Splits a stored note back into tokens; tolerates missing spaces after the separator. */
export const NOTE_TOKEN_DELIMITER = ';';

export const FIRST_PARTICIPATION_TOKEN_PATTERN = /^Первое участие$/;

export const PERSONAL_RECORD_TOKEN_PATTERN = /^ЛР \(было [\d,.:]+\)$/;

/** The hand-typed spelling of the record note found in the legacy protocols. */
export const LEGACY_PERSONAL_RECORD_TOKEN_PATTERN = /^Личный рекорд$/;

export const YEAR_BEST_TOKEN_PATTERN = /^Лучший результат \d{4} г\.$/;

/**
 * Every note `buildAutoNote` can produce, plus the legacy hand-typed 'Личный рекорд' spelling of
 * the record note. A recompute replaces exactly these tokens in a stored note and keeps
 * everything else — organiser-written text like 'Дети', 'DNF' or 'Рекорд трассы'.
 */
export const AUTO_NOTE_TOKEN_PATTERNS: readonly RegExp[] = [
  FIRST_PARTICIPATION_TOKEN_PATTERN,
  PERSONAL_RECORD_TOKEN_PATTERN,
  LEGACY_PERSONAL_RECORD_TOKEN_PATTERN,
  YEAR_BEST_TOKEN_PATTERN,
];
