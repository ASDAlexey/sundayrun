import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { Gender } from '../../core/models/gender.enum';
import { RECORD_DELTA_SIGN } from './records-page.constant';

export const HISTORY_LOAD_ERROR_MESSAGE = 'history load failed';

/** LEADERBOARD_RECORDS men sorted by best time with the name tie-break (see best-results.mock). */
export const EXPECTED_MEN_NAMES = ['Азбукин Андрей', 'Быстров Борис', 'Тихонов Трофим'];

export const EXPECTED_WOMEN_NAMES = ['Ланская Лидия'];

/** 1140000 ms formatted by formatDuration. */
export const EXPECTED_TOP_TIME_TEXT = '19:00';

/** Finds Быстров via key normalization (case-insensitive); he is second all-time. */
export const SEARCH_QUERY = 'Быстров';

export const EXPECTED_SEARCH_PLACE = 2;

export const NO_MATCH_QUERY = 'нет такого атлета';

/** Быстров's 2024 record run, reachable through the year filter. */
export const EXPECTED_YEAR_RACE_SLUG = '2024-03-10';

/** The all-time 19:00 tie: Быстров ran it first (2025-03-09), so the crown skips place-1 Азбукин. */
export const EXPECTED_CROWNED_MEN_KEY = 'быстров борис';

export const EXPECTED_CROWNED_WOMEN_KEY = 'ланская лидия';

/** EXPECTED_COURSE_RECORD_HISTORY men flipped newest first for the timeline. */
export const EXPECTED_MEN_TIMELINE_TIMES = ['19:00', '20:00', '21:00'];

export const EXPECTED_MEN_TIMELINE_DELTAS = [`${RECORD_DELTA_SIGN}1:00`, `${RECORD_DELTA_SIGN}1:00`, null];

/** Three men's record steps plus the single women's one. */
export const EXPECTED_TIMELINE_ROW_COUNT = 4;

const tieRecord = (key: string, displayName: string, dateIso: string): AthleteRecord => ({
  key,
  displayName,
  gender: Gender.male,
  participationSlugs: [],
  runs: [{ dateIso, slug: dateIso, timeMs: 1140000, distanceKm: FIVE_KM_DISTANCE_KM }],
  bestMs: 1140000,
  bestMsByYear: { '2025': 1140000 },
});

/**
 * A three-way 19:00 tie listed alphabetically as middle, earliest, latest date — the earliest-run
 * reduce inside `crownedKey` takes both of its branches before settling on Быстров.
 */
export const TIE_RECORDS: AthleteRecord[] = [
  tieRecord('азбукин андрей', 'Азбукин Андрей', '2025-03-16'),
  tieRecord('быстров борис', 'Быстров Борис', '2025-03-09'),
  tieRecord('веселов василий', 'Веселов Василий', '2025-03-23'),
];

export const EXPECTED_TIE_CROWNED_KEY = 'быстров борис';
