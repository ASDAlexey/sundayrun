import { MIN_OWNED_PERCENT, PERCENT_TOTAL } from './badge-rarity.constant';
import { YearBadgeActivityRow } from './badge-rarity.interface';
import { YearBadgeRarity } from './badge-rarity.type';
import { yearBadgesOf } from './year-badges';
import { YearBadgeType } from './year-badges.enum';

/**
 * How rare each badge is — «есть у 12% участников» on a badge chip. An athlete owns a badge once
 * any of their years earned it, so multi-year holders count once; the denominator is everyone who
 * ever started, badge or not.
 */
export function yearBadgeRarity(
  rows: YearBadgeActivityRow[],
  firstEventDateByYear: Record<string, string>,
  participantCount: number,
): YearBadgeRarity {
  if (participantCount <= 0) {
    return {};
  }

  const holdersByBadge = new Map<YearBadgeType, Set<string>>();

  for (const row of rows) {
    const badges = yearBadgesOf({
      runCount: row.runCount,
      monthCount: row.monthCount,
      ranNewYearRace: row.firstRunDateIso === firstEventDateByYear[row.year],
    });

    for (const badge of badges) {
      const holders = holdersByBadge.get(badge) ?? new Set<string>();

      holders.add(row.athleteKey);
      holdersByBadge.set(badge, holders);
    }
  }

  const rarity: YearBadgeRarity = {};

  for (const [badge, holders] of holdersByBadge) {
    rarity[badge] = Math.max(MIN_OWNED_PERCENT, Math.round((holders.size / participantCount) * PERCENT_TOTAL));
  }

  return rarity;
}
