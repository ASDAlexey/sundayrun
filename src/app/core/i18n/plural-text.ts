import { PLURAL_RULES_LOCALE } from './plural-text.constant';
import { RuPluralForms } from './plural-text.interface';

/**
 * Picks the plural form of a prebuilt `$localize` message by the ru rules. Integer counts only
 * ever select one/few/many; zero/two/other alias onto them so a full CLDR table is never needed.
 */
export function pluralText(count: number, forms: RuPluralForms): string {
  const aliases: Record<Intl.LDMLPluralRule, string> = { ...forms, zero: forms.many, two: forms.few, other: forms.many };

  return aliases[new Intl.PluralRules(PLURAL_RULES_LOCALE).select(count)];
}
