import { YearBadgeActivityRow } from './badge-rarity.interface';
import { YearBadgeRarity } from './badge-rarity.type';
import { YearBadge } from './year-badges.enum';

/** Year → its first race, the new-year one; 2024 is deliberately unknown. */
export const RARITY_FIRST_EVENT_DATE_BY_YEAR: Record<string, string> = { '2025': '2025-01-05', '2026': '2026-01-04' };

export const RARITY_PARTICIPANT_COUNT = 25;

/**
 * anna: one loaded 2025 (gold + all months + the new-year race). boris: bronze 2025 and gold 2026 —
 * owns both tiers. vera: the new-year race in both years — still one holder. grisha: a bronze 2024
 * whose unknown first race only rules the new-year badge out, not the tier.
 */
export const RARITY_ROWS: YearBadgeActivityRow[] = [
  { athleteKey: 'anna', year: '2025', runCount: 50, monthCount: 12, firstRunDateIso: '2025-01-05' },
  { athleteKey: 'boris', year: '2025', runCount: 30, monthCount: 5, firstRunDateIso: '2025-02-01' },
  { athleteKey: 'boris', year: '2026', runCount: 50, monthCount: 6, firstRunDateIso: '2026-03-07' },
  { athleteKey: 'vera', year: '2025', runCount: 1, monthCount: 1, firstRunDateIso: '2025-01-05' },
  { athleteKey: 'vera', year: '2026', runCount: 1, monthCount: 1, firstRunDateIso: '2026-01-04' },
  { athleteKey: 'grisha', year: '2024', runCount: 30, monthCount: 2, firstRunDateIso: '2024-06-01' },
];

/** Out of 25 participants: 2 gold holders → 8%, and grisha's tier-worthy 2024 still counts for bronze. */
export const EXPECTED_RARITY: YearBadgeRarity = {
  [YearBadge.obsessiveGold]: 8,
  [YearBadge.obsessiveBronze]: 8,
  [YearBadge.allMonths]: 4,
  [YearBadge.newYearRace]: 8,
};
