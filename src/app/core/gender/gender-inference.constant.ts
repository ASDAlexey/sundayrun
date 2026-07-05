import { GenderConfidence, GenderSource } from '../models/gender.enum';
import type { GenderInference } from './gender-inference.interface';

/** Input is normally 'Фамилия Имя' — the first name is the second token. */
export const FIRST_NAME_TOKEN_INDEX = 1;

export const WHITESPACE_PATTERN = /\s+/;

export const LETTER_YO = 'ё';

export const LETTER_YE = 'е';

/** Endings that heuristically indicate a female name. */
export const FEMALE_ENDING_LETTERS: readonly string[] = ['а', 'я'];

export const SOFT_SIGN_ENDING = 'ь';

export const UNKNOWN_GENDER_INFERENCE: GenderInference = {
  gender: null,
  confidence: GenderConfidence.unknown,
  source: GenderSource.unknown,
};
