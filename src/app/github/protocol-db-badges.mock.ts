import { YearBadgeRarity } from '../core/history/badge-rarity.type';
import { SeasonBestRow } from '../core/history/season-ranks.interface';
import { Season } from '../core/history/seasons.enum';
import { YearBadge } from '../core/history/year-badges.enum';
import { YearBestRow } from '../core/history/year-ranks.interface';
import { Gender } from '../core/models/gender.enum';
import { ATHLETE_KEY, RUNLESS_ATHLETE_KEY } from './protocol-db-queries.mock';

/**
 * The year bests over `POPULATED_SEED`: Иванов's fastest 5 km per year (the 2.3 km run never
 * counts), Нина's single run, the genderless Саша dropped by the SQL filter. `YEAR_REVIEW_SEED`
 * adds the corrupt-gender Хитров, whom the scan must drop too — the expectation stays the same.
 */
export const EXPECTED_DB_YEAR_BEST_ROWS: YearBestRow[] = [
  { athleteKey: ATHLETE_KEY, gender: Gender.male, year: '2024', bestMs: 1500000 },
  { athleteKey: ATHLETE_KEY, gender: Gender.male, year: '2025', bestMs: 1560000 },
  { athleteKey: RUNLESS_ATHLETE_KEY, gender: Gender.female, year: '2025', bestMs: 1700000 },
];

/**
 * The season bests over the same seed: Иванов's 5 km runs fold into spring/summer lanes per year
 * (his two 2025 spring runs keep the faster one), Нина's February run is a winter lane.
 */
export const EXPECTED_DB_SEASON_BEST_ROWS: SeasonBestRow[] = [
  { athleteKey: ATHLETE_KEY, gender: Gender.male, year: '2024', season: Season.spring, bestMs: 1600000 },
  { athleteKey: ATHLETE_KEY, gender: Gender.male, year: '2024', season: Season.summer, bestMs: 1500000 },
  { athleteKey: ATHLETE_KEY, gender: Gender.male, year: '2025', season: Season.spring, bestMs: 1560000 },
  { athleteKey: RUNLESS_ATHLETE_KEY, gender: Gender.female, year: '2025', season: Season.winter, bestMs: 1700000 },
];

/**
 * No seeded year reaches a run-count badge, but the one-lane ranking tables crown both athletes:
 * Иванов is the year king of 2024/2025 and the standing course king, Нина the queen of 2025 and
 * the course queen — 2 holders of 2 participants → 100%. Иванов's 270-day break before his 2025
 * opener also makes him the lone comeback holder → 50%. The season lanes crown Иванов in spring
 * and summer and Нина in winter — one holder of two participants each → 50%.
 */
export const EXPECTED_DB_BADGE_RARITY: YearBadgeRarity = {
  [YearBadge.courseKing]: 100,
  [YearBadge.yearKing]: 100,
  [YearBadge.comeback]: 50,
  [YearBadge.springKing]: 50,
  [YearBadge.summerKing]: 50,
  [YearBadge.winterKing]: 50,
};
