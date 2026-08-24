import { MIN_OWNED_PERCENT, PERCENT_TOTAL } from './badge-rarity.constant';
import { type YearBadgeActivityRow } from './badge-rarity.interface';
import { type YearBadgeRarity } from './badge-rarity.type';
import { yearBadgesOf } from './year-badges';
import { type YearBadgeType } from './year-badges.enum';

/** What the rarity share is measured against: the new-year dates, the denominator, and ranking holders. */
export interface YearBadgeRarityContext {
  readonly firstEventDateByYear: Record<string, string>;
  readonly participantCount: number;
  readonly extraHolders?: ReadonlyMap<YearBadgeType, ReadonlySet<string>>;
}

/**
 * How rare each badge is — «есть у 12% участников» on a badge chip. An athlete owns a badge once
 * any of their years earned it, so multi-year holders count once; the denominator is everyone who
 * ever started, badge or not. `extraHolders` brings the ranking badges (computed off their own
 * sources) into the same map.
 */
export function yearBadgeRarity(rows: YearBadgeActivityRow[], context: YearBadgeRarityContext): YearBadgeRarity {
  const { firstEventDateByYear, participantCount, extraHolders = new Map() } = context;

  if (participantCount <= 0) {
    return {};
  }

  const holdersByBadge = new Map<YearBadgeType, Set<string>>();

  for (const [badge, keys] of extraHolders) {
    holdersByBadge.set(badge, new Set(keys));
  }

  for (const row of rows) {
    const badges = yearBadgesOf({
      runCount: row.runCount,
      monthCount: row.monthCount,
      ranNewYearRace: row.firstRunDateIso === firstEventDateByYear[row.year],
      hasComeback: row.hasComeback,
      slowFinishCount: row.slowFinishCount,
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
