import { computeOverallStats } from '../../core/history/overall-stats';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { STATS_HISTORY } from '../../core/history/overall-stats.mock';
import { AthleteRecord, AthleteRun } from '../../core/models/athlete-history.interface';
import { SelfAthlete } from '../../state/self-athlete.interface';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { NO_BEST_TIME_TEXT } from '../athlete/athlete-page.constant';
import { HomeSelfView } from './home-page.interface';

export { BAKED_RACE_ITEMS, EXPECTED_RACE_ITEMS, EXPECTED_RACE_TITLES, INDEX_LOAD_ERROR_MESSAGE } from '../races/races-page.mock';

export const ATHLETES_LOAD_ERROR_MESSAGE = 'athletes history unreachable';

/** EXISTING_SITE_META (08:00) and START_TIME_ONLY_SITE_META (09:00) rendered by the course «Старт» fact. */
export const EXPECTED_COURSE_START_DEFAULT_TEXT = 'в 8:00, регистрация с 7:45';

export const EXPECTED_COURSE_START_CUSTOM_TEXT = 'в 9:00, регистрация с 8:45';

/** STATS_HISTORY rendered by the stats block, in template order: events, finishes, finishers, avg finishes, median time М/Ж. */
export const EXPECTED_STATS_VALUES = ['3', '8', '3', '2,7', '32:00', '30:00'];

/** The totals over the male finisher of STATS_HISTORY only — the women's median has nothing to show. */
export const MEN_ONLY_STATS = computeOverallStats({ 'пётр сидоров': STATS_HISTORY['пётр сидоров'] });

/** MEN_ONLY_STATS rendered by the stats block: the missing women's median degrades to a dash. */
export const EXPECTED_MEN_ONLY_STATS_VALUES = ['3', '3', '1', '3,0', '32:00', '—'];

export const HOME_SELF_PICK: SelfAthlete = { key: 'иванова мария', displayName: 'Иванова Мария' };

const selfRun = (dateIso: string, timeMs: number): AthleteRun => ({ dateIso, slug: dateIso, timeMs, distanceKm: FIVE_KM_DISTANCE_KM });

/** A 2025 event plus four 2026 Sundays; Мария skipped the second Sunday, so her current streak is the trailing two weeks. */
export const HOME_SELF_EVENT_SLUGS: string[] = ['2025-12-28', '2026-06-14', '2026-06-21', '2026-06-28', '2026-07-05'];

/** The all-time best (24:40) lands in 2025, so the year slice (RACES_TODAY_ISO is 2026) shows its own numbers. */
export const HOME_SELF_RECORD: AthleteRecord = {
  key: 'иванова мария',
  displayName: 'Иванова Мария',
  gender: null,
  participationSlugs: ['2025-12-28', '2026-06-14', '2026-06-28', '2026-07-05'],
  runs: [selfRun('2025-12-28', 1480000), selfRun('2026-06-14', 1560000), selfRun('2026-06-28', 1500000), selfRun('2026-07-05', 1520000)],
  bestMs: 1480000,
  bestMsByYear: { '2025': 1480000, '2026': 1500000 },
};

export const EXPECTED_HOME_SELF_VIEW: HomeSelfView = {
  displayName: 'Иванова Мария',
  athleteLink: [ATHLETES_PAGE_LINK, 'иванова мария'],
  finishesText: '4',
  bestTimeText: '24:40',
  streakText: '2',
  finishesYearText: '3',
  bestTimeYearText: '25:00',
};

/** The personal card values in template order: finishes, best time, streak weeks, year finishes, year best. */
export const EXPECTED_HOME_SELF_VALUES: string[] = ['4', '24:40', '2', '3', '25:00'];

/** Мария came to the newest event but has never finished 5 km — both best times degrade to the dash. */
export const HOME_SELF_DNF_RECORD: AthleteRecord = {
  key: 'иванова мария',
  displayName: 'Иванова Мария',
  gender: null,
  participationSlugs: ['2026-07-05'],
  runs: [],
  bestMs: null,
  bestMsByYear: {},
};

export const EXPECTED_HOME_SELF_DNF_VIEW: HomeSelfView = {
  displayName: 'Иванова Мария',
  athleteLink: [ATHLETES_PAGE_LINK, 'иванова мария'],
  finishesText: '0',
  bestTimeText: NO_BEST_TIME_TEXT,
  streakText: '1',
  finishesYearText: '0',
  bestTimeYearText: NO_BEST_TIME_TEXT,
};
