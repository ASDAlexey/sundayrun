import { YearBadgeType } from '../../../core/history/year-badges.enum';

/** One catalog entry: how a badge is earned and where this athlete stands with it. */
export interface BadgeCatalogRow {
  badge: YearBadgeType;
  /** «30 финишей за календарный год» — how the badge is earned. */
  description: string;
  /** «Получена: 2025, 2023» — the years the badge was awarded; null while never earned. */
  earnedYearsText: string | null;
  /** «В 2026: 12 из 30 забегов» — the live current-season progress; null once the criteria is met. */
  progressText: string | null;
  /** Progress toward the criteria, 0–99; null whenever `progressText` is null. */
  progressPercent: number | null;
  /** The badge was awarded at least once — the chip keeps its colors. */
  isEarned: boolean;
}
