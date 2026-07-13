import { YearBadgeRarity } from '../../core/history/badge-rarity.type';
import { EXPECTED_ROLLUP_HISTORY, REPEAT_RUNNER_KEY } from '../../core/history/athletes-rollup.mock';
import { CourseRecordHistory } from '../../core/history/course-records.type';
import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { LegendFinish } from '../../core/history/legend.interface';
import { MEME_THRESHOLDS } from '../../core/history/meme-thresholds.constant';
import { MemeThreshold } from '../../core/history/meme-thresholds.interface';
import { RivalRun } from '../../core/history/rivals.interface';
import { AthleteYearBadges } from '../../core/history/year-badges';
import { YearBadge } from '../../core/history/year-badges.enum';
import { YearBestRow } from '../../core/history/year-ranks.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { Gender } from '../../core/models/gender.enum';
import { formatDuration } from '../../core/time/duration';
import { VERSUS_PAGE_LINK } from '../../app.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { SELF_MEME_KEY } from './athlete-page.constant';
import {
  AthleteRunView,
  FirstLapView,
  LegendView,
  MemeRowView,
  PlacementsView,
  RivalView,
  StreaksView,
  YearBestView,
} from './athlete-page.interface';

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

/** The best first-lap split the service stub serves for `REPEAT_RUNNER_KEY`. */
export const ATHLETE_BEST_FIRST_LAP: AthleteFirstLap = { dateIso: '2026-01-03', slug: 'kuzminki-2', lapMs: 660000 };

/** `ATHLETE_BEST_FIRST_LAP` prepared for the template: the time linked to its protocol. */
export const EXPECTED_FIRST_LAP_VIEW: FirstLapView = { timeText: '11:00', raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-2'] };

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

/** Иванов with the ISO chronology participations: every event attended, the finals card gets real slugs. */
export const PLACEMENTS_RECORD: AthleteRecord = {
  ...EXPECTED_ROLLUP_HISTORY[REPEAT_RUNNER_KEY],
  participationSlugs: [...PLACEMENTS_EVENT_CHRONOLOGY],
};

/** All three finals attended; the regular 04.01 participation must not inflate the numerator. */
export const EXPECTED_FINALS_ATTENDANCE_TEXT = '3/3';

/** A record-less page over the same finals chronology attends none of them. */
export const EXPECTED_EMPTY_FINALS_ATTENDANCE_TEXT = '0/3';

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

/** Иванов's lone 2026 best — the one-lane year table crowns him king. */
export const ATHLETE_YEAR_BESTS: YearBestRow[] = [{ athleteKey: REPEAT_RUNNER_KEY, gender: Gender.male, year: '2026', bestMs: 1440000 }];

/** Иванов also holds the standing course record, set by his 2026-01-03 run. */
export const ATHLETE_COURSE_RECORDS: CourseRecordHistory = {
  [Gender.male]: [
    {
      key: REPEAT_RUNNER_KEY,
      displayName: 'Иванов Иван',
      gender: Gender.male,
      dateIso: '2026-01-03',
      slug: 'kuzminki-2',
      timeMs: 1440000,
      previousMs: null,
    },
  ],
  [Gender.female]: [],
};

/** The ranking crowns lead the 2026 row; the activity criteria award nothing on three runs. */
export const EXPECTED_RANK_YEAR_BADGES: AthleteYearBadges[] = [{ year: '2026', badges: [YearBadge.courseKing, YearBadge.yearKing] }];

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

const memeRow = (threshold: MemeThreshold, isBeaten: boolean, gapText: string | null): MemeRowView => ({
  key: threshold.key,
  name: threshold.name,
  note: threshold.note,
  timeText: formatDuration(threshold.timeMs),
  isBeaten,
  isSelf: false,
  gapText,
});

const [HIPPO, CHEPTEGEI, TSEGAY, KIPTUM, RAMSAY, BUSH, FERRELL, OPRAH, ANDERSON] = MEME_THRESHOLDS;

/** Иванов's 24:00 on the ladder: Киптум's 14:17 pace is the next target, every celebrity below is beaten. */
export const EXPECTED_MEME_ROWS: MemeRowView[] = [
  memeRow(HIPPO, false, null),
  memeRow(CHEPTEGEI, false, null),
  memeRow(TSEGAY, false, null),
  memeRow(KIPTUM, false, '9:43'),
  { key: SELF_MEME_KEY, name: 'Иванов Иван', note: null, timeText: '24:00', isBeaten: false, isSelf: true, gapText: null },
  memeRow(RAMSAY, true, null),
  memeRow(BUSH, true, null),
  memeRow(FERRELL, true, null),
  memeRow(OPRAH, true, null),
  memeRow(ANDERSON, true, null),
];

const RIVAL_KEY = 'петров пётр';

const SECOND_RIVAL_KEY = 'новиков олег';

const rivalRun = (key: string, displayName: string, dateIso: string, slug: string, timeMs: number): RivalRun => ({
  key,
  displayName,
  dateIso,
  slug,
  timeMs,
});

/**
 * The rival stub around Иванов's three runs (25:00, 24:00, 25:00): Петров finishes close at all
 * three (two athlete wins and a dead heat), Новиков at the two 2026 ones (a loss and a win),
 * Сидоров's single close finish stays a coincidence.
 */
export const ATHLETE_RIVAL_RUNS: RivalRun[] = [
  rivalRun(REPEAT_RUNNER_KEY, 'Иванов Иван', '2025-12-27', 'kuzminki-1', 1500000),
  rivalRun(RIVAL_KEY, 'Петров Пётр', '2025-12-27', 'kuzminki-1', 1506000),
  rivalRun('сидоров семён', 'Сидоров Семён', '2025-12-27', 'kuzminki-1', 1502000),
  rivalRun(REPEAT_RUNNER_KEY, 'Иванов Иван', '2026-01-03', 'kuzminki-2', 1440000),
  rivalRun(SECOND_RIVAL_KEY, 'Новиков Олег', '2026-01-03', 'kuzminki-2', 1434000),
  rivalRun(RIVAL_KEY, 'Петров Пётр', '2026-01-03', 'kuzminki-2', 1448000),
  rivalRun(REPEAT_RUNNER_KEY, 'Иванов Иван', '2026-01-10', 'kuzminki-3', 1500000),
  rivalRun(SECOND_RIVAL_KEY, 'Новиков Олег', '2026-01-10', 'kuzminki-3', 1509000),
  rivalRun(RIVAL_KEY, 'Петров Пётр', '2026-01-10', 'kuzminki-3', 1500000),
];

/** The card over the whole history: Петров by the count, Новиков next; draws stay out of the score. */
export const EXPECTED_RIVAL_VIEWS: RivalView[] = [
  {
    key: RIVAL_KEY,
    displayName: 'Петров Пётр',
    versusLink: [VERSUS_PAGE_LINK, REPEAT_RUNNER_KEY, RIVAL_KEY],
    closeText: '3 раза рядом',
    score: '2:0',
  },
  {
    key: SECOND_RIVAL_KEY,
    displayName: 'Новиков Олег',
    versusLink: [VERSUS_PAGE_LINK, REPEAT_RUNNER_KEY, SECOND_RIVAL_KEY],
    closeText: '2 раза рядом',
    score: '1:1',
  },
];

/** The season both rivals count two close finishes in — the tie goes to Петров's smaller gap total. */
export const RIVAL_SEASON_FILTER = '2026';

export const EXPECTED_SEASON_RIVAL_VIEWS: RivalView[] = [
  { ...EXPECTED_RIVAL_VIEWS[0], closeText: '2 раза рядом', score: '1:0' },
  { ...EXPECTED_RIVAL_VIEWS[1] },
];
