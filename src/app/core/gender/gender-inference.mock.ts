import { Gender, GenderConfidence, GenderSource } from '../models/gender.enum';
import { UNKNOWN_GENDER_INFERENCE } from './gender-inference.constant';
import type { GenderInference } from './gender-inference.interface';

const MALE_HIGH: GenderInference = {
  gender: Gender.male,
  confidence: GenderConfidence.high,
  source: GenderSource.dictionary,
};

const FEMALE_HIGH: GenderInference = {
  gender: Gender.female,
  confidence: GenderConfidence.high,
  source: GenderSource.dictionary,
};

const MALE_LOW: GenderInference = {
  gender: Gender.male,
  confidence: GenderConfidence.low,
  source: GenderSource.heuristic,
};

const FEMALE_LOW: GenderInference = {
  gender: Gender.female,
  confidence: GenderConfidence.low,
  source: GenderSource.heuristic,
};

/** [full name input, expected inference]. */
export const INFER_GENDER_CASES: readonly (readonly [string, GenderInference])[] = [
  // every first name from the real data resolves via dictionary with high confidence
  ['Иванов Антон', MALE_HIGH],
  ['Иванов Сергей', MALE_HIGH],
  ['Иванова Наталья', FEMALE_HIGH],
  ['Иванов Павел', MALE_HIGH],
  ['Иванова Анастасия', FEMALE_HIGH],
  ['Иванов Никита', MALE_HIGH],
  ['Иванов Денис', MALE_HIGH],
  ['Иванов Виктор', MALE_HIGH],
  ['Иванов Николай', MALE_HIGH],
  ['Иванов Дмитрий', MALE_HIGH],
  ['Иванов Артем', MALE_HIGH],
  ['Иванова Екатерина', FEMALE_HIGH],
  ['Иванова Людмила', FEMALE_HIGH],
  ['Иванов Юрий', MALE_HIGH],
  ['Иванова Мила', FEMALE_HIGH],
  ['Иванова Ирина', FEMALE_HIGH],
  ['Иванова Альбина', FEMALE_HIGH],
  // ё is normalized to е
  ['Петров Артём', MALE_HIGH],
  // diminutives are in the dictionaries
  ['Смирнова Наташа', FEMALE_HIGH],
  ['Смирнов Дима', MALE_HIGH],
  ['Смирнов Коля', MALE_HIGH],
  // -ь female names present in the dictionary resolve there, not via heuristic
  ['Смирнова Любовь', FEMALE_HIGH],
  // 3+ tokens: the second token is the first name
  ['Иванов Антон Петрович', MALE_HIGH],
  // ambiguous diminutive (in both dictionaries)
  ['Иванов Женя', UNKNOWN_GENDER_INFERENCE],
  // heuristics for names absent from the dictionaries
  ['Иванов Бромбарк', MALE_LOW],
  ['Иванова Мабрита', FEMALE_LOW],
  ['Иванова Зукария', FEMALE_LOW],
  // male -а/-я exception, deliberately absent from RUSSIAN_MALE_NAMES
  ['Селянинович Микула', MALE_LOW],
  // -ь endings: known female soft-sign name vs unresolvable
  ['Иванова Адель', FEMALE_LOW],
  ['Иванов Ювираль', UNKNOWN_GENDER_INFERENCE],
  // unresolvable inputs
  ['Иванов', UNKNOWN_GENDER_INFERENCE],
  ['', UNKNOWN_GENDER_INFERENCE],
  ['   ', UNKNOWN_GENDER_INFERENCE],
];

/** Male -а/-я exception name that must stay out of the dictionary path. */
export const MALE_A_YA_EXCEPTION_SAMPLE = 'микула';
