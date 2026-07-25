import { Gender, GenderType } from '../../../core/models/gender.enum';

/**
 * Suggestions shown at once. Eight is enough to tell two namesakes apart and still short enough to
 * scan without scrolling the sheet — the search is a shortcut, not a browsable directory.
 */
export const TIMER_PICKER_SUGGESTION_LIMIT = 8;

/**
 * How many regulars the checkbox list offers. Thirty is the whole field of a busy Sunday, which is
 * exactly the point: «30 человек добавляются за один заход, а не за 30 поисков» (docs/TIMER.md §5).
 */
export const TIMER_PICKER_REGULARS_LIMIT = 30;

/** Nobody timed in the archive — the fallback that keeps the regular ranking a total order. */
export const TIMER_PICKER_NO_APPEARANCES = 0;

/** A full name needs a surname and a first name: «Попов» alone is not a participant. */
export const TIMER_PICKER_MIN_NAME_PARTS = 2;

/** Empty search box, empty newcomer box — one shared blank so no stray `''` sits in the code. */
export const TIMER_PICKER_EMPTY_TEXT = '';

/** «Ж · 47 забегов» — what sits between the gender and the appearance count of a suggestion. */
export const TIMER_PICKER_META_SEPARATOR = ' · ';

/** «Справочник от 26.07» — day and month is all the offline line has room for. */
export const TIMER_PICKER_ROSTER_DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });

/** The М/Ж toggle offers exactly these two, in this order. */
export const TIMER_PICKER_GENDERS: readonly GenderType[] = [Gender.male, Gender.female];

/** `aria-labelledby` of the sheet points at its own heading — the dialog names itself. */
export const TIMER_PICKER_TITLE_ID = 'timer-picker-title';

/**
 * Id of the throwaway runner the duplicate-surname check is run against. It exists for the length of
 * one comparison and never reaches a session, so a fixed string is honest here.
 */
export const TIMER_PICKER_PROBE_ID = 'timer-picker-probe';

/** Prerender has no window; the id built off this pair is never stored anywhere. */
export const TIMER_PICKER_SSR_NOW_MS = 0;

/** The `randomFn` stand-in of the same prerender path. */
export const TIMER_PICKER_SSR_RANDOM = 0;
