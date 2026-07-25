import { pluralText } from '../../../core/i18n/plural-text';

/** «ещё 1 не прошёл круг / ещё 7 не прошли круг» — each plural form is a separate message. */
export function pendingLapText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timer.lapPendingOne:ещё ${count}:count: не прошёл круг`,
    few: $localize`:@@timer.lapPendingFew:ещё ${count}:count: не прошли круг`,
    many: $localize`:@@timer.lapPendingMany:ещё ${count}:count: не прошли круг`,
  });
}
