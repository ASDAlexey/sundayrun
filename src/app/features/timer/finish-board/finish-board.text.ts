import { pluralText } from '../../../core/i18n/plural-text';

/** «1 время / 2 времени / 5 времён без имени» — each plural form is a separate message. */
export function unassignedTimesText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timer.finishUnnamedOne:${count}:count: время без имени`,
    few: $localize`:@@timer.finishUnnamedFew:${count}:count: времени без имени`,
    many: $localize`:@@timer.finishUnnamedMany:${count}:count: времён без имени`,
  });
}
