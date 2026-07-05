import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { OverallStats } from './overall-stats.interface';

/**
 * Two finishers across three events plus a DNF-only athlete: three events, four finishes
 * (one of them 10 km), two unique finishers, 2.0 finishes each; the average time skips the
 * 10 km run — (26:00 + 30:00 + 34:00) / 3 = 30:00.
 */
export const STATS_HISTORY: AthletesHistory = {
  'мария иванова': {
    key: 'мария иванова',
    displayName: 'Мария Иванова',
    gender: Gender.female,
    participationSlugs: ['2026-06-21', '2026-06-28'],
    runs: [
      { dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-06-28', slug: '2026-06-28', timeMs: 1800000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1560000,
    bestMsByYear: { '2026': 1560000 },
  },
  'пётр сидоров': {
    key: 'пётр сидоров',
    displayName: 'Пётр Сидоров',
    gender: Gender.male,
    participationSlugs: ['2026-06-21', '2026-07-05'],
    runs: [
      { dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 2040000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-07-05', slug: '2026-07-05', timeMs: 3600000, distanceKm: 10 },
    ],
    bestMs: 2040000,
    bestMsByYear: { '2026': 2040000 },
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
  finishesCount: 4,
  finishersCount: 2,
  averageFinishes: 2,
  averageTimeMs: 1800000,
};

export const EMPTY_STATS: OverallStats = {
  eventsCount: 0,
  finishesCount: 0,
  finishersCount: 0,
  averageFinishes: 0,
  averageTimeMs: 0,
};
