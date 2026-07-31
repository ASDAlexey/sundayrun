import { pluralText } from '../../../core/i18n/plural-text';

/** «1 время / 2 времени / 5 времён без имени» — each plural form is a separate message. */
export function unnamedTimesText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timerPublish.unnamedOne:${count}:count: время без имени`,
    few: $localize`:@@timerPublish.unnamedFew:${count}:count: времени без имени`,
    many: $localize`:@@timerPublish.unnamedMany:${count}:count: времён без имени`,
  });
}

/** «Уточните пол: 1 человек / 2 человека / 5 человек» — the publication is blocked until it is empty. */
export function unknownGenderText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timerPublish.genderOne:уточните пол: ${count}:count: человек`,
    few: $localize`:@@timerPublish.genderFew:уточните пол: ${count}:count: человека`,
    many: $localize`:@@timerPublish.genderMany:уточните пол: ${count}:count: человек`,
  });
}

/** The answer «Сохранить» gives while somebody's time is still nobody's — said only when it is pressed. */
export function resolveFirstText(): string {
  return $localize`:@@timerPublish.resolveFirst:сначала разберите все времена`;
}

/** Nobody was timed at all — the one thing that cannot be fixed by editing the protocol. */
export function emptyRosterText(): string {
  return $localize`:@@timerPublish.emptyRoster:в составе никого — сохранять нечего`;
}
