import { YearBadgeRarity } from '../../core/history/badge-rarity.type';
import { REPEAT_RUNNER_KEY } from '../../core/history/athletes-rollup.mock';
import { LegendFinish } from '../../core/history/legend.interface';
import { YearBadge } from '../../core/history/year-badges.enum';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { AthleteRunView, LegendView, PlacementsView, StreaksView, YearBestView } from './athlete-page.interface';

/** Denormalized on purpose: resolves to `REPEAT_RUNNER_KEY` only after key normalization. */
export const DENORMALIZED_KEY_PARAM = ' ИВАНОВ ИВАН ';

export const UNKNOWN_KEY_PARAM = 'неизвестный атлет';

export const ATHLETE_LOAD_ERROR_MESSAGE = 'athlete history load failed';

/** Slug → place, as the service stub serves it for `REPEAT_RUNNER_KEY`; the other runs show the dash. */
export const STUB_RUN_PLACES: Record<string, number> = { 'kuzminki-2': 1 };

const FIRST_RUN_VIEW: AthleteRunView = {
  slug: 'kuzminki-1',
  raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-1'],
  dateShort: '27.12.2025 г.',
  timeText: '25:00',
  placeText: '—',
  isMonthFinal: false,
};

const SECOND_RUN_VIEW: AthleteRunView = {
  slug: 'kuzminki-2',
  raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-2'],
  dateShort: '03.01.2026 г.',
  timeText: '24:00',
  placeText: '1',
  isMonthFinal: false,
};

const THIRD_RUN_VIEW: AthleteRunView = {
  slug: 'kuzminki-3',
  raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-3'],
  dateShort: '10.01.2026 г.',
  timeText: '25:00',
  placeText: '—',
  isMonthFinal: false,
};

/** `REPEAT_RUNNER_KEY`'s runs, fastest first (the default sort); the 25:00 tie keeps the stable input order. */
export const EXPECTED_BY_TIME_VIEWS: AthleteRunView[] = [SECOND_RUN_VIEW, FIRST_RUN_VIEW, THIRD_RUN_VIEW];

/** The same runs, newest first. */
export const EXPECTED_BY_DATE_VIEWS: AthleteRunView[] = [THIRD_RUN_VIEW, SECOND_RUN_VIEW, FIRST_RUN_VIEW];

export const ATHLETE_YEAR_FILTER = '2025';

export const EXPECTED_YEAR_FILTERED_VIEWS: AthleteRunView[] = [FIRST_RUN_VIEW];

export const EXPECTED_RUN_YEAR_OPTIONS = ['2026', '2025'];

/** The 2026 best equals the all-time record, so its cell carries the accent mark. */
export const EXPECTED_YEAR_BEST_VIEWS: YearBestView[] = [
  { year: '2026', timeText: '24:00', raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-2'], isAllTime: true },
  { year: '2025', timeText: '25:00', raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-1'], isAllTime: false },
];

export const EXPECTED_BEST_TIME_TEXT = '24:00';

/** An athlete with a 2.3 km first run (`EXPECTED_ROLLUP_HISTORY`'s Новиков Олег). */
export const SHORT_RUNNER_KEY_PARAM = 'новиков олег';

/** Новиков's only 5 km run; his 2.3 km run never reaches the page, and the places stub is not his. */
export const EXPECTED_SHORT_RUNNER_VIEWS: AthleteRunView[] = [
  {
    slug: 'kuzminki-2',
    raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-2'],
    dateShort: '03.01.2026 г.',
    timeText: '23:20',
    placeText: '—',
    isMonthFinal: false,
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

/** An ISO chronology where every past month closes with its final: 25.01, 22.02 and 29.03. */
export const PLACEMENTS_EVENT_CHRONOLOGY: string[] = ['2026-01-04', '2026-01-25', '2026-02-22', '2026-03-29'];

/** Places for the finals card: a regular second place plus one of each podium step at the finals. */
export const PLACEMENTS_RUN_PLACES: Record<string, number> = {
  '2026-01-04': 2,
  '2026-01-25': 1,
  '2026-02-22': 2,
  '2026-03-29': 3,
};

/** The card those places build: the best place on either kind and one chip per podium step. */
export const EXPECTED_PLACEMENTS_VIEW: PlacementsView = {
  bestFinalPlace: 1,
  bestRegularPlace: 2,
  podiumTexts: ['1-е место ×1', '2-е место ×1', '3-е место ×1'],
  hasPlaces: true,
};

/** No known places at all — the finals card stays hidden. */
export const EMPTY_PLACEMENTS_VIEW: PlacementsView = {
  bestFinalPlace: null,
  bestRegularPlace: null,
  podiumTexts: [],
  hasPlaces: false,
};

/** The rarity shares the service stub returns; the page passes them to the chips untouched. */
export const STUB_BADGE_RARITY: YearBadgeRarity = { [YearBadge.newYearRace]: 12 };

/** Every finish the legend stub serves: Иванов leads with three, Новиков trails with two. */
export const LEGEND_FINISHES: LegendFinish[] = [
  { key: REPEAT_RUNNER_KEY, displayName: 'Иванов Иван', dateIso: '2025-12-27' },
  { key: REPEAT_RUNNER_KEY, displayName: 'Иванов Иван', dateIso: '2026-01-03' },
  { key: REPEAT_RUNNER_KEY, displayName: 'Иванов Иван', dateIso: '2026-01-10' },
  { key: SHORT_RUNNER_KEY_PARAM, displayName: 'Новиков Олег', dateIso: '2025-12-27' },
  { key: SHORT_RUNNER_KEY_PARAM, displayName: 'Новиков Олег', dateIso: '2026-01-03' },
];

/** Иванов holds the crown: three windowed finishes fill the bar. */
export const EXPECTED_LEGEND_VIEW: LegendView = {
  isLegend: true,
  countText: '3 финиша',
  legendName: 'Иванов Иван',
  legendCountText: '3 финиша',
  toCrownText: '0 финишей',
  progressPercent: 100,
};

/** Новиков chases with two finishes against three — «до короны — 2 финиша», halfway up the bar. */
export const EXPECTED_CHASER_LEGEND_VIEW: LegendView = {
  isLegend: false,
  countText: '2 финиша',
  legendName: 'Иванов Иван',
  legendCountText: '3 финиша',
  toCrownText: '2 финиша',
  progressPercent: 50,
};

/** No finishes on the board at all — the title is vacant and one finish takes it. */
export const EMPTY_LEGEND_VIEW: LegendView = {
  isLegend: false,
  countText: '0 финишей',
  legendName: null,
  legendCountText: '0 финишей',
  toCrownText: '1 финиш',
  progressPercent: 0,
};
