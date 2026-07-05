import { LEADERBOARD_RECORDS } from '../../core/history/best-results.mock';
import { AthletesHistory } from '../../core/models/athletes-history.type';

export const RECORDS_HISTORY_MOCK: AthletesHistory = Object.fromEntries(LEADERBOARD_RECORDS.map((record) => [record.key, record]));

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
