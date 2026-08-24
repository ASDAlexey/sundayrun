import { type AthleteRecord } from '../models/athlete-history.interface';
import { type AthletesHistory } from '../models/athletes-history.type';
import { Gender, GenderConfidence, GenderSource, type GenderType } from '../models/gender.enum';
import { type Participant } from '../models/participant.interface';

function toArchivedRecord(key: string, { displayName, gender }: { displayName: string; gender: GenderType | null }): AthleteRecord {
  return { key, displayName, gender, participationSlugs: [], runs: [], bestMs: null, bestMsByYear: {} };
}

export const NAME_ORDER_HISTORY: AthletesHistory = {
  'иванов иван': toArchivedRecord('иванов иван', { displayName: 'Иванов Иван', gender: Gender.male }),
  'елкина алена': toArchivedRecord('елкина алена', { displayName: 'Ёлкина Алёна', gender: Gender.female }),
  'цопкало людмила': toArchivedRecord('цопкало людмила', { displayName: 'Цопкало Людмила', gender: null }),
};

export const REVERSED_PARTICIPANT: Participant = {
  id: 1,
  fullName: 'Алёна Ёлкина',
  totalMs: 1500000,
  lapsMs: [690000, 810000],
  gender: null,
  genderConfidence: GenderConfidence.unknown,
  genderSource: GenderSource.unknown,
  note: '',
  club: '',
};

export const EXPECTED_REVERSED_PARTICIPANT: Participant = {
  ...REVERSED_PARTICIPANT,
  fullName: 'Ёлкина Алёна',
  gender: Gender.female,
  genderConfidence: GenderConfidence.high,
  genderSource: GenderSource.history,
};

/** Not in the archive either way — the swap comes from the first-names dictionary. */
export const NEW_REVERSED_PARTICIPANT: Participant = {
  ...REVERSED_PARTICIPANT,
  id: 2,
  fullName: 'Никита Лютов',
};

export const EXPECTED_NEW_REVERSED_PARTICIPANT: Participant = {
  ...NEW_REVERSED_PARTICIPANT,
  fullName: 'Лютов Никита',
  gender: Gender.male,
  genderConfidence: GenderConfidence.high,
  genderSource: GenderSource.dictionary,
};

export const MANUAL_GENDER_PARTICIPANT: Participant = {
  ...REVERSED_PARTICIPANT,
  id: 3,
  fullName: 'Людмила Цопкало',
  gender: Gender.female,
  genderConfidence: GenderConfidence.high,
  genderSource: GenderSource.manual,
};

export const EXPECTED_MANUAL_GENDER_PARTICIPANT: Participant = {
  ...MANUAL_GENDER_PARTICIPANT,
  fullName: 'Цопкало Людмила',
};
