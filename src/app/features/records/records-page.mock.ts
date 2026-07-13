import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { SeasonRun } from '../../core/history/season-positions.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { Gender } from '../../core/models/gender.enum';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { RECORD_DELTA_SIGN } from './records-page.constant';
import { ChartPick, FirstLapRecordView } from './records-page.interface';

export const HISTORY_LOAD_ERROR_MESSAGE = 'history load failed';

/** Matches every SEASON_RUNS filler (11 of them) — more than the suggestion cap. */
export const CHART_FILLER_QUERY = 'филлеров';

/** The lone woman of SEASON_RUNS: the chart picker searches both genders at once. */
export const CHART_WOMAN_QUERY = 'ланская';

export const EXPECTED_CHART_WOMAN_KEY = 'ланская лидия';

/** The SEASON_RUNS leader, picked into the highlight set by the chart search test. */
export const CHART_PICK: ChartPick = { key: 'волков виктор', displayName: 'Волков Виктор' };

/** A season outside the cache, so switching to it forces a (failing) load in the chart error test. */
export const SEASON_ERROR_YEAR = '2023';

/** One recorded lap: the «Первый круг» chart mode ranks these splits instead of the 5 km times. */
export const SEASON_LAP_RUNS: SeasonRun[] = [
  { key: 'круговой кирилл', displayName: 'Круговой Кирилл', gender: Gender.male, dateIso: '2026-04-05', timeMs: 555000 },
];

export const EXPECTED_LAP_LEADER_KEY = 'круговой кирилл';

/** The lap-mode toggle option and the tagline marker the metric test looks for. */
export const METRIC_FIRST_LAP_TEXT = 'Первый круг';

export const EXPECTED_LAP_TAGLINE_FRAGMENT = 'первых кругов';

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

/** EXPECTED_FIRST_LAP_RECORDS (see first-lap.mock) prepared for the template. */
export const EXPECTED_MEN_FIRST_LAP_VIEW: FirstLapRecordView = {
  key: 'быстров борис',
  athleteLink: [ATHLETES_PAGE_LINK, 'быстров борис'],
  displayName: 'Быстров Борис',
  timeText: '8:00',
  dateShort: '02.03.2025 г.',
  raceLink: [RACE_PAGE_BASE_LINK, '2025-03-02'],
};

export const EXPECTED_WOMEN_FIRST_LAP_VIEW: FirstLapRecordView = {
  key: 'ланская лидия',
  athleteLink: [ATHLETES_PAGE_LINK, 'ланская лидия'],
  displayName: 'Ланская Лидия',
  timeText: '10:00',
  dateShort: '11.05.2025 г.',
  raceLink: [RACE_PAGE_BASE_LINK, '2025-05-11'],
};

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
