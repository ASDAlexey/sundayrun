import { YearBadge, YearBadgeType } from '../../core/history/year-badges.enum';

/** BEM modifier suffix per badge; obsessive tiers get their medal styling. */
export const YEAR_BADGE_MODIFIERS: Record<YearBadgeType, string> = {
  [YearBadge.obsessiveGold]: 'year-badge_gold',
  [YearBadge.obsessiveSilver]: 'year-badge_silver',
  [YearBadge.obsessiveBronze]: 'year-badge_bronze',
  [YearBadge.allMonths]: 'year-badge_months',
  [YearBadge.newYearRace]: 'year-badge_new-year',
};

/** Visible chip text per badge. */
export const YEAR_BADGE_LABELS: Record<YearBadgeType, string> = {
  [YearBadge.obsessiveGold]: $localize`:@@yearBadge.obsessiveGold:50 забегов за год`,
  [YearBadge.obsessiveSilver]: $localize`:@@yearBadge.obsessiveSilver:40 забегов за год`,
  [YearBadge.obsessiveBronze]: $localize`:@@yearBadge.obsessiveBronze:30 забегов за год`,
  [YearBadge.allMonths]: $localize`:@@yearBadge.allMonths:Все 12 месяцев`,
  [YearBadge.newYearRace]: $localize`:@@yearBadge.newYearRace:Новогодний забег`,
};
