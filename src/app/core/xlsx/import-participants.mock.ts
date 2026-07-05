import { Gender, GenderConfidence, GenderSource } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';

export const TROILIN_FULL_NAME = 'Троилин Антон';

export const KHANDYGA_FULL_NAME = 'Хандыга Наталья';

export const EXPECTED_TROILIN_GENDER_FIELDS: Partial<Participant> = {
  gender: Gender.male,
  genderConfidence: GenderConfidence.high,
  genderSource: GenderSource.dictionary,
  note: '',
  club: '',
};

export const EXPECTED_KHANDYGA_GENDER_FIELDS: Partial<Participant> = {
  gender: Gender.female,
  genderConfidence: GenderConfidence.high,
  genderSource: GenderSource.dictionary,
  note: '',
  club: '',
};
