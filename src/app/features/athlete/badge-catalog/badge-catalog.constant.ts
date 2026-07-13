import { YearBadge, YearBadgeType } from '../../../core/history/year-badges.enum';

/** One catalog listing: a badge and how it is earned, in the catalog's own words. */
export interface BadgeCatalogEntry {
  badge: YearBadgeType;
  description: string;
}

/** The catalog ladder, easiest tier first — the reader climbs toward the course crown. */
export const BADGE_CATALOG: readonly BadgeCatalogEntry[] = [
  {
    badge: YearBadge.obsessiveBronze,
    description: $localize`:@@badgeCatalog.obsessiveBronze:30 финишей за календарный год — любая дистанция`,
  },
  {
    badge: YearBadge.obsessiveSilver,
    description: $localize`:@@badgeCatalog.obsessiveSilver:40 финишей за календарный год — любая дистанция`,
  },
  {
    badge: YearBadge.obsessiveGold,
    description: $localize`:@@badgeCatalog.obsessiveGold:50 финишей за календарный год — любая дистанция`,
  },
  {
    badge: YearBadge.allMonths,
    description: $localize`:@@badgeCatalog.allMonths:Хотя бы один забег в каждом из 12 месяцев года`,
  },
  {
    badge: YearBadge.newYearRace,
    description: $localize`:@@badgeCatalog.newYearRace:Финишировать в первом забеге года`,
  },
  {
    badge: YearBadge.yearTopThirty,
    description: $localize`:@@badgeCatalog.yearTopThirty:Войти в 30 лучших результатов года — у мужчин и женщин свой зачёт; в текущем году место ещё можно потерять`,
  },
  {
    badge: YearBadge.yearTopTen,
    description: $localize`:@@badgeCatalog.yearTopTen:Войти в 10 лучших результатов года — у мужчин и женщин свой зачёт; в текущем году место ещё можно потерять`,
  },
  {
    badge: YearBadge.yearPodium,
    description: $localize`:@@badgeCatalog.yearPodium:2-е или 3-е место в лучших результатах года`,
  },
  {
    badge: YearBadge.yearKing,
    description: $localize`:@@badgeCatalog.yearKing:Лучший результат года на 5 км`,
  },
  {
    badge: YearBadge.courseKing,
    description: $localize`:@@badgeCatalog.courseKing:Действующий рекорд трассы на 5 км — корона переходит к новому рекордсмену`,
  },
];

/** The full progress scale — a met criteria drops the progress line instead of showing 100. */
export const FULL_PROGRESS_PERCENT = 100;
