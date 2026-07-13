import { AthleteYearBadges, YearActivity } from '../../../core/history/year-badges';
import {
  MONTHS_IN_YEAR,
  OBSESSIVE_BRONZE_RUN_COUNT,
  OBSESSIVE_GOLD_RUN_COUNT,
  OBSESSIVE_SILVER_RUN_COUNT,
} from '../../../core/history/year-badges.constant';
import { YearBadge, YearBadgeType } from '../../../core/history/year-badges.enum';
import { BADGE_CATALOG, FULL_PROGRESS_PERCENT } from './badge-catalog.constant';
import { BadgeCatalogRow } from './badge-catalog.interface';

/** Finished runs the obsessive tiers ask for within one calendar year. */
const TIER_RUN_TARGETS: Partial<Record<YearBadgeType, number>> = {
  [YearBadge.obsessiveBronze]: OBSESSIVE_BRONZE_RUN_COUNT,
  [YearBadge.obsessiveSilver]: OBSESSIVE_SILVER_RUN_COUNT,
  [YearBadge.obsessiveGold]: OBSESSIVE_GOLD_RUN_COUNT,
};

/**
 * The «Все награды» catalog: every badge the archive can award, easiest first, each with
 * the athlete's earned years and the live progress of the current season. The progress
 * line disappears once the criteria is met — the earned years speak for themselves then.
 */
export function badgeCatalogRows(earned: AthleteYearBadges[], activity: YearActivity, currentYear: string): BadgeCatalogRow[] {
  return BADGE_CATALOG.map(({ badge, description }) => {
    const years = earned.flatMap((entry) => (entry.badges.includes(badge) ? [entry.year] : []));
    const progress = toProgress(badge, activity, currentYear);

    return {
      badge,
      description,
      earnedYearsText: years.length > 0 ? $localize`:@@badgeCatalog.earnedYears:Получена: ${years.join(', ')}:years:` : null,
      progressText: progress?.text ?? null,
      progressPercent: progress?.percent ?? null,
      isEarned: years.length > 0,
    };
  });
}

/** The current-season progress line; null once the criteria is met or the badge shows none. */
function toProgress(badge: YearBadgeType, activity: YearActivity, year: string): { text: string; percent: number } | null {
  const runTarget = TIER_RUN_TARGETS[badge];

  if (runTarget !== undefined && activity.runCount < runTarget) {
    return {
      text: $localize`:@@badgeCatalog.runsProgress:В ${year}:year:: ${activity.runCount}:count: из ${runTarget}:target: забегов`,
      percent: toPercent(activity.runCount, runTarget),
    };
  }

  if (badge === YearBadge.allMonths && activity.monthCount < MONTHS_IN_YEAR) {
    return {
      text: $localize`:@@badgeCatalog.monthsProgress:В ${year}:year:: ${activity.monthCount}:count: из ${MONTHS_IN_YEAR}:target: месяцев`,
      percent: toPercent(activity.monthCount, MONTHS_IN_YEAR),
    };
  }

  return null;
}

function toPercent(current: number, target: number): number {
  return Math.round((FULL_PROGRESS_PERCENT * current) / target);
}
