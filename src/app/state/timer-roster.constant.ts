import { Gender, GenderType } from '../core/models/gender.enum';
import { TimerRosterCache } from './timer-roster.interface';
import { TimerStorage } from './timer-storage.type';

/** localStorage key of the cached athlete directory — what makes «Атлеты» work offline (docs/TIMER.md §5). */
export const TIMER_ROSTER_STORAGE_KEY = 'sundayrun.timer.roster.v1';

/** Version of the cached payload; anything else was written by another release and is ignored. */
export const TIMER_ROSTER_SCHEMA_VERSION = 2;

/** No first lap of that gender in the archive yet — the «Круг» table simply shows no record mark. */
export const EMPTY_COURSE_RECORD_LAP_MS: Readonly<Record<GenderType, number | null>> = { [Gender.male]: null, [Gender.female]: null };

/** Never read, or read from a payload that no longer matches: the sheet starts empty and asks the net. */
export const EMPTY_TIMER_ROSTER_CACHE: TimerRosterCache = {
  records: [],
  expectedLapMs: new Map(),
  bestLapMs: new Map(),
  appearanceCount: new Map(),
  courseRecordLapMs: EMPTY_COURSE_RECORD_LAP_MS,
  savedAtMs: null,
};

/** Prerender has no localStorage and no roster sheet, so a stub of the used subset suffices. */
export const TIMER_ROSTER_SSR_NOOP_STORAGE: TimerStorage = {
  getItem: () => null,
  setItem: () => undefined,
};

/** Prerender has no window either; the value is only ever written next to an unused cache. */
export const TIMER_ROSTER_SSR_NOW_MS = 0;

/** Every cached per-athlete number is stored as a `[key, value]` pair — a `Map` does not survive JSON. */
export const KEY_NUMBER_PAIR_LENGTH = 2;

/** Position of the athlete key inside that pair. */
export const KEY_NUMBER_PAIR_KEY_INDEX = 0;

/** Position of the number — a lap in ms, or a plain count — inside that pair. */
export const KEY_NUMBER_PAIR_VALUE_INDEX = 1;

/** The runs of a cached entry are not stored: search and tile order never look at them. */
export const CACHED_ATHLETE_BEST_MS = null;
