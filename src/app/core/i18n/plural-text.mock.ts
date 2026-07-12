import { RuPluralForms } from './plural-text.interface';

export const PLURAL_FORMS: RuPluralForms = { one: 'забег', few: 'забега', many: 'забегов' };

/** [count, expected form] over every ru integer category, including the 0 and 21+ edges. */
export const PLURAL_TEXT_CASES: readonly (readonly [number, string])[] = [
  [1, PLURAL_FORMS.one],
  [21, PLURAL_FORMS.one],
  [2, PLURAL_FORMS.few],
  [4, PLURAL_FORMS.few],
  [0, PLURAL_FORMS.many],
  [5, PLURAL_FORMS.many],
  [11, PLURAL_FORMS.many],
  [100, PLURAL_FORMS.many],
];
