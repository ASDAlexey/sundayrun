import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { OverallStats } from './overall-stats.interface';

/**
 * Three finishers across three events plus a DNF-only athlete: three events, eight finishes
 * (one of them 10 km), three unique finishers, 8/3 finishes each. The medians skip the
 * 10 km run and split by gender: women 26:00/30:00/40:00 → 30:00 (a mean would say 32:00,
 * so the test tells the two apart), men — the even-sized 30:00/34:00 → 32:00; the
 * unknown-gender runs land in neither median.
 */
export const STATS_HISTORY: AthletesHistory = {
  'мария иванова': {
    key: 'мария иванова',
    displayName: 'Мария Иванова',
    gender: Gender.female,
    participationSlugs: ['2026-06-21', '2026-06-28', '2026-07-05'],
    runs: [
      { dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-06-28', slug: '2026-06-28', timeMs: 1800000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-07-05', slug: '2026-07-05', timeMs: 2400000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1560000,
    bestMsByYear: { '2026': 1560000 },
  },
  'пётр сидоров': {
    key: 'пётр сидоров',
    displayName: 'Пётр Сидоров',
    gender: Gender.male,
    participationSlugs: ['2026-06-21', '2026-06-28', '2026-07-05'],
    runs: [
      { dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 2040000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-06-28', slug: '2026-06-28', timeMs: 1800000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-07-05', slug: '2026-07-05', timeMs: 3600000, distanceKm: 10 },
    ],
    bestMs: 1800000,
    bestMsByYear: { '2026': 1800000 },
  },
  'иван безфамильный': {
    key: 'иван безфамильный',
    displayName: 'Иван Безфамильный',
    gender: null,
    participationSlugs: ['2026-06-21', '2026-06-28'],
    runs: [
      { dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 1620000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-06-28', slug: '2026-06-28', timeMs: 1740000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1620000,
    bestMsByYear: { '2026': 1620000 },
  },
  'анна днф': {
    key: 'анна днф',
    displayName: 'Анна Днф',
    gender: Gender.female,
    participationSlugs: ['2026-07-05'],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
};

export const EXPECTED_STATS: OverallStats = {
  eventsCount: 3,
  finishesCount: 8,
  finishersCount: 3,
  averageFinishes: 8 / 3,
  medianTimeMenMs: 1920000,
  medianTimeWomenMs: 1800000,
};

export const EMPTY_STATS: OverallStats = {
  eventsCount: 0,
  finishesCount: 0,
  finishersCount: 0,
  averageFinishes: 0,
  medianTimeMenMs: 0,
  medianTimeWomenMs: 0,
};
