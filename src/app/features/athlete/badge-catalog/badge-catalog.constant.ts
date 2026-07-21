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
    badge: YearBadge.comeback,
    description: $localize`:@@badgeCatalog.comeback:Финишировать после перерыва в три месяца и больше`,
  },
  {
    badge: YearBadge.cameAnyway,
    description: $localize`:@@badgeCatalog.cameAnyway:10 финишей на 5 км за год медленнее своей медианы за всё время — главное не темп, а участие`,
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
    badge: YearBadge.winterPodium,
    description: $localize`:@@badgeCatalog.winterPodium:2-е или 3-е место в лучших результатах зимы — января, февраля и декабря года`,
  },
  {
    badge: YearBadge.winterKing,
    description: $localize`:@@badgeCatalog.winterKing:Лучший результат зимы на 5 км — у мужчин и женщин свой зачёт`,
  },
  {
    badge: YearBadge.springPodium,
    description: $localize`:@@badgeCatalog.springPodium:2-е или 3-е место в лучших результатах весны`,
  },
  {
    badge: YearBadge.springKing,
    description: $localize`:@@badgeCatalog.springKing:Лучший результат весны на 5 км — у мужчин и женщин свой зачёт`,
  },
  {
    badge: YearBadge.summerPodium,
    description: $localize`:@@badgeCatalog.summerPodium:2-е или 3-е место в лучших результатах лета`,
  },
  {
    badge: YearBadge.summerKing,
    description: $localize`:@@badgeCatalog.summerKing:Лучший результат лета на 5 км — у мужчин и женщин свой зачёт`,
  },
  {
    badge: YearBadge.autumnPodium,
    description: $localize`:@@badgeCatalog.autumnPodium:2-е или 3-е место в лучших результатах осени`,
  },
  {
    badge: YearBadge.autumnKing,
    description: $localize`:@@badgeCatalog.autumnKing:Лучший результат осени на 5 км — у мужчин и женщин свой зачёт`,
  },
  {
    badge: YearBadge.courseKing,
    description: $localize`:@@badgeCatalog.courseKing:Действующий рекорд трассы на 5 км — корона переходит к новому рекордсмену`,
  },
];

/** The full progress scale — a met criteria drops the progress line instead of showing 100. */
export const FULL_PROGRESS_PERCENT = 100;
