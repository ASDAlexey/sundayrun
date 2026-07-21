import { YearBadgeRarity } from '../../../core/history/badge-rarity.type';
import { AthleteYearBadges, YearActivity } from '../../../core/history/year-badges';
import { YearBadge, YearBadgeType } from '../../../core/history/year-badges.enum';
import { BADGE_CATALOG } from './badge-catalog.constant';
import { BadgeCatalogRow } from './badge-catalog.interface';

// `reduce` instead of `find()?.… ?? ''` — no dead never-missing fallback branch in coverage.
const descriptionOf = (badge: YearBadgeType): string =>
  BADGE_CATALOG.reduce((description, entry) => (entry.badge === badge ? entry.description : description), '');

/** The running year of the progress lines. */
export const CATALOG_YEAR = '2026';

/** Bronze and the new-year run in 2025, bronze again in 2024 — silver, gold and the months stay locked. */
export const CATALOG_YEAR_BADGES: AthleteYearBadges[] = [
  { year: '2025', badges: [YearBadge.obsessiveBronze, YearBadge.newYearRace] },
  { year: '2024', badges: [YearBadge.obsessiveBronze] },
];

/** 33 runs across 7 months, no new-year race, no comeback, 4 slow finishes: bronze met, four progress lines. */
export const CATALOG_ACTIVITY: YearActivity = {
  runCount: 33,
  monthCount: 7,
  ranNewYearRace: false,
  hasComeback: false,
  slowFinishCount: 4,
};

export const CATALOG_RARITY: YearBadgeRarity = { [YearBadge.obsessiveBronze]: 2 };

/** Easiest first: bronze met and earned, silver/gold/months in progress, the new-year badge earned. */
export const EXPECTED_CATALOG_ROWS: BadgeCatalogRow[] = [
  {
    badge: YearBadge.obsessiveBronze,
    description: descriptionOf(YearBadge.obsessiveBronze),
    earnedYearsText: 'Получена: 2025, 2024',
    progressText: null,
    progressPercent: null,
    isEarned: true,
  },
  {
    badge: YearBadge.obsessiveSilver,
    description: descriptionOf(YearBadge.obsessiveSilver),
    earnedYearsText: null,
    progressText: 'В 2026: 33 из 40 забегов',
    progressPercent: 83,
    isEarned: false,
  },
  {
    badge: YearBadge.obsessiveGold,
    description: descriptionOf(YearBadge.obsessiveGold),
    earnedYearsText: null,
    progressText: 'В 2026: 33 из 50 забегов',
    progressPercent: 66,
    isEarned: false,
  },
  {
    badge: YearBadge.allMonths,
    description: descriptionOf(YearBadge.allMonths),
    earnedYearsText: null,
    progressText: 'В 2026: 7 из 12 месяцев',
    progressPercent: 58,
    isEarned: false,
  },
  {
    badge: YearBadge.newYearRace,
    description: descriptionOf(YearBadge.newYearRace),
    earnedYearsText: 'Получена: 2025',
    progressText: null,
    progressPercent: null,
    isEarned: true,
  },
  {
    badge: YearBadge.comeback,
    description: descriptionOf(YearBadge.comeback),
    earnedYearsText: null,
    progressText: null,
    progressPercent: null,
    isEarned: false,
  },
  {
    badge: YearBadge.cameAnyway,
    description: descriptionOf(YearBadge.cameAnyway),
    earnedYearsText: null,
    progressText: 'В 2026: 4 из 10 неспешных финишей',
    progressPercent: 40,
    isEarned: false,
  },
  ...(
    [
      YearBadge.yearTopThirty,
      YearBadge.yearTopTen,
      YearBadge.yearPodium,
      YearBadge.yearKing,
      YearBadge.winterPodium,
      YearBadge.winterKing,
      YearBadge.springPodium,
      YearBadge.springKing,
      YearBadge.summerPodium,
      YearBadge.summerKing,
      YearBadge.autumnPodium,
      YearBadge.autumnKing,
      YearBadge.courseKing,
    ] as const
  ).map((badge) => ({
    badge,
    description: descriptionOf(badge),
    earnedYearsText: null,
    progressText: null,
    progressPercent: null,
    isEarned: false,
  })),
];

/** Every criteria met this year: no progress lines anywhere. */
export const FULL_YEAR_ACTIVITY: YearActivity = {
  runCount: 50,
  monthCount: 12,
  ranNewYearRace: true,
  hasComeback: true,
  slowFinishCount: 10,
};
