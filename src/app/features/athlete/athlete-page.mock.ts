import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { AthleteRunView, StreaksView, YearBestView } from './athlete-page.interface';

/** Denormalized on purpose: resolves to `REPEAT_RUNNER_KEY` only after key normalization. */
export const DENORMALIZED_KEY_PARAM = ' ИВАНОВ ИВАН ';

export const UNKNOWN_KEY_PARAM = 'неизвестный атлет';

export const ATHLETE_LOAD_ERROR_MESSAGE = 'athlete history load failed';

const FIRST_RUN_VIEW: AthleteRunView = {
  slug: 'kuzminki-1',
  raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-1'],
  dateShort: '27.12.2025 г.',
  timeText: '25:00',
};

const SECOND_RUN_VIEW: AthleteRunView = {
  slug: 'kuzminki-2',
  raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-2'],
  dateShort: '03.01.2026 г.',
  timeText: '24:00',
};

const THIRD_RUN_VIEW: AthleteRunView = {
  slug: 'kuzminki-3',
  raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-3'],
  dateShort: '10.01.2026 г.',
  timeText: '25:00',
};

/** `REPEAT_RUNNER_KEY`'s runs, fastest first (the default sort); the 25:00 tie keeps the stable input order. */
export const EXPECTED_BY_TIME_VIEWS: AthleteRunView[] = [SECOND_RUN_VIEW, FIRST_RUN_VIEW, THIRD_RUN_VIEW];

/** The same runs, newest first. */
export const EXPECTED_BY_DATE_VIEWS: AthleteRunView[] = [THIRD_RUN_VIEW, SECOND_RUN_VIEW, FIRST_RUN_VIEW];

export const ATHLETE_YEAR_FILTER = '2025';

export const EXPECTED_YEAR_FILTERED_VIEWS: AthleteRunView[] = [FIRST_RUN_VIEW];

export const EXPECTED_RUN_YEAR_OPTIONS = ['2026', '2025'];

export const EXPECTED_YEAR_BEST_VIEWS: YearBestView[] = [
  { year: '2026', timeText: '24:00' },
  { year: '2025', timeText: '25:00' },
];

export const EXPECTED_BEST_TIME_TEXT = '24:00';

/** An athlete with a 2.3 km first run (`EXPECTED_ROLLUP_HISTORY`'s Новиков Олег). */
export const SHORT_RUNNER_KEY_PARAM = 'новиков олег';

/** Новиков's only 5 km run; his 2.3 km run never reaches the page. */
export const EXPECTED_SHORT_RUNNER_VIEWS: AthleteRunView[] = [
  {
    slug: 'kuzminki-2',
    raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-2'],
    dateShort: '03.01.2026 г.',
    timeText: '23:20',
  },
];

/** The full archive chronology the streaks run against — the three `EXPECTED_ROLLUP_HISTORY` races. */
export const EVENT_SLUG_CHRONOLOGY: string[] = ['kuzminki-1', 'kuzminki-2', 'kuzminki-3'];

/** Иванов ran all three races (one unbroken streak); his second 25:00 broke the record chain — no «Раж». */
export const EXPECTED_STREAKS_VIEW: StreaksView = { currentText: '3 недели', maxText: '3 недели', rageCount: 0 };

/** The DNF-only athlete showed up to the first race alone: the streak is over but stays on record. */
export const EXPECTED_DNF_STREAKS_VIEW: StreaksView = { currentText: '0 недель', maxText: '1 неделя', rageCount: 0 };

/** No athlete — no streaks. */
export const EMPTY_STREAKS_VIEW: StreaksView = { currentText: '0 недель', maxText: '0 недель', rageCount: 0 };
