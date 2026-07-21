import { YearBadge, YearBadgeType } from './year-badges.enum';
import { Season, SeasonType } from './seasons.enum';

/** The rank that crowns the season's king — the best 5 km time of the season. */
export const SEASON_KING_RANK = 1;

/** The last rank the season podium badge covers; ranks 2–3 are the season's «призёры». */
export const SEASON_PODIUM_MAX_RANK = 3;

/** Season → its crown badge. */
export const SEASON_KING_BADGES: Record<SeasonType, YearBadgeType> = {
  [Season.winter]: YearBadge.winterKing,
  [Season.spring]: YearBadge.springKing,
  [Season.summer]: YearBadge.summerKing,
  [Season.autumn]: YearBadge.autumnKing,
};

/** Season → its podium badge. */
export const SEASON_PODIUM_BADGES: Record<SeasonType, YearBadgeType> = {
  [Season.winter]: YearBadge.winterPodium,
  [Season.spring]: YearBadge.springPodium,
  [Season.summer]: YearBadge.summerPodium,
  [Season.autumn]: YearBadge.autumnPodium,
};
