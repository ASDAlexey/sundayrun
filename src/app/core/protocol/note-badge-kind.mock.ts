import { NoteBadgeKind, NoteBadgeKindType } from './note-badge-kind.enum';

/** [note token, expected badge kind]. */
export const NOTE_BADGE_KIND_CASES: readonly (readonly [string, NoteBadgeKindType])[] = [
  ['ЛР (было 27:13)', NoteBadgeKind.record],
  ['Личный рекорд', NoteBadgeKind.record],
  ['Лучший результат 2026 г.', NoteBadgeKind.yearBest],
  ['Первое участие', NoteBadgeKind.debut],
  ['Дети', NoteBadgeKind.kids],
  ['Детский забег', NoteBadgeKind.kids],
  ['DNF', NoteBadgeKind.status],
  ['DSQ Детский забег', NoteBadgeKind.status],
  ['сход с дистанции', NoteBadgeKind.plain],
];
