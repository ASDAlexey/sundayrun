import { YearBadge, YearBadgeType } from '../../core/history/year-badges.enum';
import { YearBadgeArt, YearBadgeArtType } from './year-badge.enum';

/** BEM modifier suffix per badge; obsessive tiers get their medal styling. */
export const YEAR_BADGE_MODIFIERS: Record<YearBadgeType, string> = {
  [YearBadge.obsessiveGold]: 'year-badge_gold',
  [YearBadge.obsessiveSilver]: 'year-badge_silver',
  [YearBadge.obsessiveBronze]: 'year-badge_bronze',
  [YearBadge.allMonths]: 'year-badge_months',
  [YearBadge.newYearRace]: 'year-badge_new-year',
  [YearBadge.comeback]: 'year-badge_comeback',
  [YearBadge.cameAnyway]: 'year-badge_came-anyway',
  [YearBadge.courseKing]: 'year-badge_course-king',
  [YearBadge.yearKing]: 'year-badge_year-king',
  [YearBadge.yearPodium]: 'year-badge_year-podium',
  [YearBadge.yearTopTen]: 'year-badge_year-top-ten',
  [YearBadge.yearTopThirty]: 'year-badge_year-top-thirty',
};

/** Which drawing each badge renders. */
export const YEAR_BADGE_ART: Record<YearBadgeType, YearBadgeArtType> = {
  [YearBadge.obsessiveGold]: YearBadgeArt.medal,
  [YearBadge.obsessiveSilver]: YearBadgeArt.medal,
  [YearBadge.obsessiveBronze]: YearBadgeArt.medal,
  [YearBadge.allMonths]: YearBadgeArt.wheel,
  [YearBadge.newYearRace]: YearBadgeArt.flake,
  [YearBadge.comeback]: YearBadgeArt.loop,
  [YearBadge.cameAnyway]: YearBadgeArt.heart,
  [YearBadge.courseKing]: YearBadgeArt.crown,
  [YearBadge.yearKing]: YearBadgeArt.crown,
  [YearBadge.yearPodium]: YearBadgeArt.podium,
  [YearBadge.yearTopTen]: YearBadgeArt.laurel,
  [YearBadge.yearTopThirty]: YearBadgeArt.laurel,
};

/** Big number engraved on the medal for finish-count tiers; other badges draw their own art. */
export const YEAR_BADGE_TIER_NUMBERS: Partial<Record<YearBadgeType, number>> = {
  [YearBadge.obsessiveGold]: 50,
  [YearBadge.obsessiveSilver]: 40,
  [YearBadge.obsessiveBronze]: 30,
};

/** The number inside the laurel wreath — the year-table cut the badge stands for. */
export const YEAR_BADGE_LAUREL_NUMBERS: Partial<Record<YearBadgeType, number>> = {
  [YearBadge.yearTopTen]: 10,
  [YearBadge.yearTopThirty]: 30,
};

/** Visible chip text per badge. */
export const YEAR_BADGE_LABELS: Record<YearBadgeType, string> = {
  [YearBadge.obsessiveGold]: $localize`:@@yearBadge.obsessiveGold:50 забегов за год`,
  [YearBadge.obsessiveSilver]: $localize`:@@yearBadge.obsessiveSilver:40 забегов за год`,
  [YearBadge.obsessiveBronze]: $localize`:@@yearBadge.obsessiveBronze:30 забегов за год`,
  [YearBadge.allMonths]: $localize`:@@yearBadge.allMonths:Все 12 месяцев`,
  [YearBadge.newYearRace]: $localize`:@@yearBadge.newYearRace:Новогодний забег`,
  [YearBadge.comeback]: $localize`:@@yearBadge.comeback:Возвращение`,
  [YearBadge.cameAnyway]: $localize`:@@yearBadge.cameAnyway:Главное — участие`,
  [YearBadge.courseKing]: $localize`:@@yearBadge.courseKing:Король трассы`,
  [YearBadge.yearKing]: $localize`:@@yearBadge.yearKing:Король года`,
  [YearBadge.yearPodium]: $localize`:@@yearBadge.yearPodium:Призёр года`,
  [YearBadge.yearTopTen]: $localize`:@@yearBadge.yearTopTen:Топ-10 года`,
  [YearBadge.yearTopThirty]: $localize`:@@yearBadge.yearTopThirty:Топ-30 года`,
};

/** The crown chips read as «Королева» on a woman's page; unlisted badges keep the neutral label. */
export const YEAR_BADGE_FEMALE_LABELS: Partial<Record<YearBadgeType, string>> = {
  [YearBadge.courseKing]: $localize`:@@yearBadge.courseQueen:Королева трассы`,
  [YearBadge.yearKing]: $localize`:@@yearBadge.yearQueen:Королева года`,
};
