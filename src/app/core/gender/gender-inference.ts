import { Gender, GenderConfidence, GenderSource } from '../models/gender.enum';
import {
  FEMALE_ENDING_LETTERS,
  FIRST_NAME_TOKEN_INDEX,
  LETTER_YE,
  LETTER_YO,
  SOFT_SIGN_ENDING,
  UNKNOWN_GENDER_INFERENCE,
  WHITESPACE_PATTERN,
} from './gender-inference.constant';
import type { GenderInference } from './gender-inference.interface';
import {
  FEMALE_SOFT_SIGN_NAMES,
  MALE_NAME_A_YA_ENDING_EXCEPTIONS,
  RUSSIAN_FEMALE_NAMES,
  RUSSIAN_MALE_NAMES,
} from './russian-names.constant';

/**
 * Infers gender from a 'Фамилия Имя [Отчество]' string: dictionary lookup of
 * the first-name token (high confidence), then ending heuristics (low
 * confidence). Ambiguous or unresolvable names yield gender null.
 */
export function inferGender(fullName: string): GenderInference {
  const tokens = fullName
    .trim()
    .toLowerCase()
    .replaceAll(LETTER_YO, LETTER_YE)
    .split(WHITESPACE_PATTERN)
    .filter((token) => token.length > 0);

  if (tokens.length <= FIRST_NAME_TOKEN_INDEX) {
    return UNKNOWN_GENDER_INFERENCE;
  }

  const firstName = tokens[FIRST_NAME_TOKEN_INDEX];
  const isMale = RUSSIAN_MALE_NAMES.has(firstName);
  const isFemale = RUSSIAN_FEMALE_NAMES.has(firstName);

  if (isMale !== isFemale) {
    return {
      gender: isMale ? Gender.male : Gender.female,
      confidence: GenderConfidence.high,
      source: GenderSource.dictionary,
    };
  }

  if (isMale && isFemale) {
    return UNKNOWN_GENDER_INFERENCE;
  }

  if (FEMALE_ENDING_LETTERS.some((letter) => firstName.endsWith(letter))) {
    return {
      gender: MALE_NAME_A_YA_ENDING_EXCEPTIONS.has(firstName) ? Gender.male : Gender.female,
      confidence: GenderConfidence.low,
      source: GenderSource.heuristic,
    };
  }

  if (firstName.endsWith(SOFT_SIGN_ENDING)) {
    return FEMALE_SOFT_SIGN_NAMES.has(firstName)
      ? { gender: Gender.female, confidence: GenderConfidence.low, source: GenderSource.heuristic }
      : UNKNOWN_GENDER_INFERENCE;
  }

  return { gender: Gender.male, confidence: GenderConfidence.low, source: GenderSource.heuristic };
}
