import { Gender } from '../models/gender.enum';
import { SeasonBestRow } from './season-ranks.interface';
import { Season } from './seasons.enum';
import { YearBadge } from './year-badges.enum';
import { YearRankedBadge } from './year-ranks.interface';

export const SEASON_RANK_ATHLETE = 'иванов иван';

/**
 * One summer-2026 male table of four (king, tied podium pair, fourth without a badge), a
 * one-lane female table of the same season and a winter lane of the same athlete — proving
 * the tables split by year-season-gender and a tie shares the podium.
 */
export const SEASON_BEST_ROWS: SeasonBestRow[] = [
  { athleteKey: SEASON_RANK_ATHLETE, gender: Gender.male, year: '2026', season: Season.summer, bestMs: 1400000 },
  { athleteKey: 'петров пётр', gender: Gender.male, year: '2026', season: Season.summer, bestMs: 1500000 },
  { athleteKey: 'сидоров семён', gender: Gender.male, year: '2026', season: Season.summer, bestMs: 1500000 },
  { athleteKey: 'четвёртый фёдор', gender: Gender.male, year: '2026', season: Season.summer, bestMs: 1600000 },
  { athleteKey: 'цопкало людмила', gender: Gender.female, year: '2026', season: Season.summer, bestMs: 1700000 },
  { athleteKey: SEASON_RANK_ATHLETE, gender: Gender.male, year: '2025', season: Season.winter, bestMs: 1450000 },
];

export const EXPECTED_SEASON_RANKED_BADGES: YearRankedBadge[] = [
  { athleteKey: SEASON_RANK_ATHLETE, year: '2026', badge: YearBadge.summerKing },
  { athleteKey: 'петров пётр', year: '2026', badge: YearBadge.summerPodium },
  { athleteKey: 'сидоров семён', year: '2026', badge: YearBadge.summerPodium },
  { athleteKey: 'цопкало людмила', year: '2026', badge: YearBadge.summerKing },
  { athleteKey: SEASON_RANK_ATHLETE, year: '2025', badge: YearBadge.winterKing },
];

/** Иванов's own badges grouped by year — the athlete-page merge input. */
export const EXPECTED_ATHLETE_SEASON_BADGES: Record<string, (typeof YearBadge)[keyof typeof YearBadge][]> = {
  '2026': [YearBadge.summerKing],
  '2025': [YearBadge.winterKing],
};
