import { pluralText } from '../../../core/i18n/plural-text';

/** The place is taken, the surname is not in yet — the line says exactly that and nothing more. */
export function unnamedLapText(): string {
  return $localize`:@@timer.lapUnnamed:без имени`;
}

/** «ещё 1 не прошёл круг / ещё 7 не прошли круг» — each plural form is a separate message. */
export function pendingLapText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timer.lapPendingOne:ещё ${count}:count: не прошёл круг`,
    few: $localize`:@@timer.lapPendingFew:ещё ${count}:count: не прошли круг`,
    many: $localize`:@@timer.lapPendingMany:ещё ${count}:count: не прошли круг`,
  });
}
