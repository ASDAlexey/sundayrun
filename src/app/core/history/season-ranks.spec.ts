import { describe, expect, it } from 'vitest';

import { athleteSeasonRankBadges, seasonRankBadgeHolders, seasonRankedBadges } from './season-ranks';
import { EXPECTED_ATHLETE_SEASON_BADGES, EXPECTED_SEASON_RANKED_BADGES, SEASON_BEST_ROWS, SEASON_RANK_ATHLETE } from './season-ranks.mock';
import { YearBadge } from './year-badges.enum';

describe('seasonRankedBadges', () => {
  it('ranks each year-season-gender table by best time: crown, shared podium ties, nothing past third', () => {
    expect(seasonRankedBadges(SEASON_BEST_ROWS)).toEqual(EXPECTED_SEASON_RANKED_BADGES);
    expect(seasonRankedBadges([])).toEqual([]);
  });
});

describe('athleteSeasonRankBadges', () => {
  it('groups one athlete’s season badges by year and ignores everyone else', () => {
    expect(athleteSeasonRankBadges(SEASON_BEST_ROWS, SEASON_RANK_ATHLETE)).toEqual(EXPECTED_ATHLETE_SEASON_BADGES);
    expect(athleteSeasonRankBadges(SEASON_BEST_ROWS, 'неизвестный')).toEqual({});
  });
});

describe('seasonRankBadgeHolders', () => {
  it('collects every holder per badge across the years for the rarity counters', () => {
    const holders = seasonRankBadgeHolders(SEASON_BEST_ROWS);

    expect(holders.get(YearBadge.summerKing)).toEqual(new Set([SEASON_RANK_ATHLETE, 'цопкало людмила']));
    expect(holders.get(YearBadge.summerPodium)).toEqual(new Set(['петров пётр', 'сидоров семён']));
    expect(holders.get(YearBadge.winterKing)).toEqual(new Set([SEASON_RANK_ATHLETE]));
    expect(holders.get(YearBadge.autumnKing)).toBeUndefined();
  });
});
