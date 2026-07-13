import { athleteYearRankBadges, yearRankBadge, yearRankBadgeHolders, yearRankedBadges } from './year-ranks';
import {
  EXPECTED_M0_RANK_BADGES,
  EXPECTED_SOLO_RANKED_BADGES,
  EXPECTED_TIED_QUEEN_BADGES,
  EXPECTED_YEAR_RANK_HOLDERS,
  SOLO_YEAR_BEST_ROWS,
  YEAR_BEST_ROWS,
  YEAR_RANK_BADGE_CASES,
} from './year-ranks.mock';

describe('yearRankBadge', () => {
  it('maps a rank to its ladder badge over every boundary', () => {
    for (const [rank, expected] of YEAR_RANK_BADGE_CASES) {
      expect(yearRankBadge(rank), `rank ${rank}`).toBe(expected);
    }
  });
});

describe('yearRankedBadges', () => {
  it('ranks each gender table on its own and lets a tie share the rank', () => {
    expect(yearRankedBadges(SOLO_YEAR_BEST_ROWS)).toEqual(EXPECTED_SOLO_RANKED_BADGES);
    expect(yearRankBadgeHolders(YEAR_BEST_ROWS)).toEqual(EXPECTED_YEAR_RANK_HOLDERS);
    expect(yearRankBadgeHolders([]), 'no rows — no holders').toEqual(new Map());
  });
});

describe('athleteYearRankBadges', () => {
  it('collects one athlete’s ranking badge per year', () => {
    expect(athleteYearRankBadges(YEAR_BEST_ROWS, 'm0')).toEqual(EXPECTED_M0_RANK_BADGES);
    expect(athleteYearRankBadges(YEAR_BEST_ROWS, 'ванда'), 'a tied best still crowns the queen').toEqual(EXPECTED_TIED_QUEEN_BADGES);
    expect(athleteYearRankBadges(YEAR_BEST_ROWS, 'm30'), 'rank 31 earns nothing').toEqual({});
  });
});
