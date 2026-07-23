import { LEADERBOARD_RECORDS } from '../../core/history/best-results.mock';
import { EXPECTED_COURSE_RECORD_HISTORY } from '../../core/history/course-records.mock';
import { CourseRecordHistory } from '../../core/history/course-records.type';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { EXPECTED_FIRST_LAP_RECORDS } from '../../core/history/first-lap.mock';
import { EVEN_TOTAL_MS, NEGATIVE_LAP_MS, indexOf } from '../../core/history/pacing.mock';
import { EventWinnerTimes } from '../../core/history/runner-scores.interface';
import { EventWeatherRow } from '../../core/history/weather-records.interface';
import { WEATHER_ROWS_MOCK } from '../../core/history/weather-records.mock';
import { SeasonRun } from '../../core/history/season-positions.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { FEMALE_GENDER_TEXT, MALE_GENDER_TEXT, RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import {
  DECIMAL_COMMA,
  EVENEST_FEMALE_LABEL,
  EVENEST_MALE_LABEL,
  NO_GRADE_TEXT,
  PACING_DEVIATION_DECIMALS,
  PACING_DEVIATION_PREFIX,
  PACING_PERCENT_BASE,
  RECORD_DELTA_SIGN,
  SECOND_HALF_FEMALE_LABEL,
  SECOND_HALF_MALE_LABEL,
  WEATHER_COLDEST_LABEL,
  WEATHER_HOTTEST_LABEL,
  WEATHER_WINDIEST_LABEL,
} from './records-page.constant';
import { ChartPick, FirstLapRecordView, PacingNomineeView, RatingRowView, RecordsData, WeatherExtremeView } from './records-page.interface';

export const HISTORY_LOAD_ERROR_MESSAGE = 'history load failed';

/** A prerendered boards payload for the trustBaked path: the browser renders it without a refetch. */
export const BAKED_RECORDS_DATA: RecordsData = {
  records: LEADERBOARD_RECORDS,
  courseRecords: EXPECTED_COURSE_RECORD_HISTORY,
  firstLapRecords: EXPECTED_FIRST_LAP_RECORDS,
  weatherRows: WEATHER_ROWS_MOCK,
  winnerEvents: [],
  pacingRows: [],
};

/** `boris`'s median deviation over PACING_BOARD_ROWS, as the card formats it: «±2,6%». */
const BORIS_DEVIATION_TEXT = `${PACING_DEVIATION_PREFIX}${(Math.abs(indexOf(NEGATIVE_LAP_MS, EVEN_TOTAL_MS) - 1) * PACING_PERCENT_BASE)
  .toFixed(PACING_DEVIATION_DECIMALS)
  .replace('.', DECIMAL_COMMA)}%`;

/**
 * `pacingBoards(PACING_BOARD_ROWS, null)` viewed: the evenest pair, then the second-half pair
 * with petr's 2024 race widening his all-time tally to +7 over four starts.
 */
export const EXPECTED_PACING_VIEWS: PacingNomineeView[] = [
  {
    label: EVENEST_MALE_LABEL,
    key: 'boris',
    athleteLink: [ATHLETES_PAGE_LINK, 'boris'],
    displayName: 'boris',
    valueText: BORIS_DEVIATION_TEXT,
    detailText: 'Забегов со сплитами: 3',
  },
  {
    label: EVENEST_FEMALE_LABEL,
    key: 'anna',
    athleteLink: [ATHLETES_PAGE_LINK, 'anna'],
    displayName: 'anna',
    valueText: '±0,0%',
    detailText: 'Забегов со сплитами: 3',
  },
  {
    label: SECOND_HALF_MALE_LABEL,
    key: 'petr',
    athleteLink: [ATHLETES_PAGE_LINK, 'petr'],
    displayName: 'petr',
    valueText: '+7 мест',
    detailText: 'Забегов со сплитами: 4',
  },
  {
    label: SECOND_HALF_FEMALE_LABEL,
    key: 'zoya',
    athleteLink: [ATHLETES_PAGE_LINK, 'zoya'],
    displayName: 'zoya',
    valueText: '+3 места',
    detailText: 'Забегов со сплитами: 3',
  },
];

/** The 2025 cut drops petr's 2024 race: «+6 мест» over three starts. */
export const EXPECTED_2025_PETR_VALUE = '+6 мест';

/** The lone 2024 pair never reaches three scoped races — the section hides. */
export const PACING_EMPTY_YEAR = '2024';

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

/**
 * Winner times behind LEADERBOARD_RECORDS' events. Быстров won five of his six starts and lost
 * once (95), Азбукин and Тихонов lost their only races (95 and 90), Ланская lost hers (96).
 * The newest event day — 2025-05-11 — anchors the form year, leaving only Быстров's 2024 run out.
 */
export const RATING_WINNER_EVENTS: EventWinnerTimes[] = [
  { slug: '2024-03-10', dateIso: '2024-03-10', bestMaleMs: 1260000, bestFemaleMs: null },
  { slug: '2025-03-02', dateIso: '2025-03-02', bestMaleMs: 1200000, bestFemaleMs: null },
  { slug: '2025-03-09', dateIso: '2025-03-09', bestMaleMs: 1140000, bestFemaleMs: null },
  { slug: '2025-03-16', dateIso: '2025-03-16', bestMaleMs: 1140000, bestFemaleMs: null },
  { slug: '2025-03-23', dateIso: '2025-03-23', bestMaleMs: 1140000, bestFemaleMs: null },
  { slug: '2025-03-30', dateIso: '2025-03-30', bestMaleMs: 1197000, bestFemaleMs: null },
  { slug: '2025-04-06', dateIso: '2025-04-06', bestMaleMs: 1083000, bestFemaleMs: null },
  { slug: '2025-05-04', dateIso: '2025-05-04', bestMaleMs: 1620000, bestFemaleMs: null },
  { slug: '2025-05-11', dateIso: '2025-05-11', bestMaleMs: null, bestFemaleMs: 1440000 },
];

const ratingRow = (
  place: number,
  key: string,
  displayName: string,
  gender: GenderType,
  formText: string,
  rankText: string,
  gradeText: string,
): RatingRowView => ({
  place,
  key,
  athleteLink: [ATHLETES_PAGE_LINK, key],
  displayName,
  gender,
  genderText: gender === Gender.male ? MALE_GENDER_TEXT : FEMALE_GENDER_TEXT,
  formText,
  rankText,
  gradeText,
});

/** The men's records only: the vacant women's board leaves Ланская without a grade. */
export const RATING_COURSE_RECORDS: CourseRecordHistory = {
  [Gender.male]: EXPECTED_COURSE_RECORD_HISTORY[Gender.male],
  [Gender.female]: [],
};

/**
 * The combined board over `RATING_COURSE_RECORDS`: Быстров's five window scores weight into 99
 * (rank 99,2 over six starts), then the one-race athletes by their single score; the men grade
 * against the 19:00 record (the slowest at 63,3), Ланская grades on a dash — the women's board is
 * vacant here. Сошедшая Софья never ran — no row.
 */
export const EXPECTED_RATING_ROWS: RatingRowView[] = [
  ratingRow(1, 'быстров борис', 'Быстров Борис', Gender.male, '99', '99,2', '100'),
  ratingRow(2, 'ланская лидия', 'Ланская Лидия', Gender.female, '96', '96', NO_GRADE_TEXT),
  ratingRow(3, 'азбукин андрей', 'Азбукин Андрей', Gender.male, '95', '95', '100'),
  ratingRow(4, 'тихонов трофим', 'Тихонов Трофим', Gender.male, '90', '90', '63,3'),
];

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

/** `WEATHER_ROWS_MOCK` (see weather-records.mock) prepared for the template: all-time extremes. */
export const EXPECTED_WEATHER_VIEWS: WeatherExtremeView[] = [
  {
    label: WEATHER_COLDEST_LABEL,
    valueText: '🌨️ -14°',
    detailText: 'ветер 11 км/ч',
    dateShort: '11.02.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-02-11'],
  },
  {
    label: WEATHER_HOTTEST_LABEL,
    valueText: '☀️ +31°',
    detailText: 'ветер 2 км/ч',
    dateShort: '13.07.2025 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2025-07-13'],
  },
  {
    label: WEATHER_WINDIEST_LABEL,
    valueText: '💨 40 км/ч',
    detailText: '+27°',
    dateShort: '02.06.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-06-02'],
  },
];

/** The season the year-filter test narrows the weather extremes to. */
export const WEATHER_SEASON_YEAR = '2025';

/** The 2025 season slice of `WEATHER_ROWS_MOCK`: its coldest day stores no wind, so no detail line. */
export const EXPECTED_2025_COLDEST_VIEW: WeatherExtremeView = {
  label: WEATHER_COLDEST_LABEL,
  valueText: '☁️ -3°',
  detailText: '',
  dateShort: '05.01.2025 г.',
  raceLink: [RACE_PAGE_BASE_LINK, '2025-01-05'],
};

/** Two events with a temperature but no stored wind — the extremes drop the windiest card. */
export const WINDLESS_WEATHER_ROWS: EventWeatherRow[] = [
  { slug: '2024-02-11', temperatureC: -8, apparentC: null, precipitationMm: null, windKmh: null, weatherCode: 71 },
  { slug: '2024-07-14', temperatureC: 29, apparentC: null, precipitationMm: null, windKmh: null, weatherCode: 0 },
];

/** `WINDLESS_WEATHER_ROWS` prepared for the template: only the cold and hot cards, no wind card. */
export const EXPECTED_WINDLESS_WEATHER_VIEWS: WeatherExtremeView[] = [
  {
    label: WEATHER_COLDEST_LABEL,
    valueText: '🌨️ -8°',
    detailText: '',
    dateShort: '11.02.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-02-11'],
  },
  {
    label: WEATHER_HOTTEST_LABEL,
    valueText: '☀️ +29°',
    detailText: '',
    dateShort: '14.07.2024 г.',
    raceLink: [RACE_PAGE_BASE_LINK, '2024-07-14'],
  },
];

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
