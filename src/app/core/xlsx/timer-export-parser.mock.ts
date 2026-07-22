import { GenderConfidence, GenderSource } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';

export const EXPECTED_PARTICIPANT_COUNT_14 = 8;

export const EXPECTED_PARTICIPANT_COUNT_24 = 16;

/** Ковшова Ирина — 15th data row of 24.05.2026.xlsx: empty Total, Lap 1 only. */
export const KOVSHOVA_INDEX = 14;

export const LAST_PARTICIPANT_NAME_24 = 'Ищенко Альбина';

const UNKNOWN_PARTICIPANT_FIELDS = {
  gender: null,
  genderConfidence: GenderConfidence.unknown,
  genderSource: GenderSource.unknown,
  note: '',
  club: '',
};

export const EXPECTED_FIRST_PARTICIPANT_14: Participant = {
  id: 1,
  fullName: 'Троилин Антон',
  totalMs: 1143028,
  lapsMs: [509705, 633323],
  ...UNKNOWN_PARTICIPANT_FIELDS,
};

export const EXPECTED_KOVSHOVA_PARTICIPANT: Participant = {
  id: 15,
  fullName: 'Ковшова Ирина',
  totalMs: null,
  lapsMs: [1044841],
  ...UNKNOWN_PARTICIPANT_FIELDS,
};

/** Empty row before the header, header found case-insensitively after trim, mixed-case names, stop at empty name cell. */
export const SYNTHETIC_EXPORT_ROWS: string[][] = [
  [],
  ['  NAME  ', 'Total'],
  ['бегун-скороход  ОДИН', '0:10:00,000', '', '', '0:10:00,000'],
  ['БЕГУН два'],
  ['', 'ignored'],
  ['Бегун Три', '0:09:00', '', '', '0:04:00', '0:05:00'],
];

export const EXPECTED_SYNTHETIC_PARTICIPANTS: Participant[] = [
  { id: 1, fullName: 'Бегун-Скороход Один', totalMs: 600000, lapsMs: [600000], ...UNKNOWN_PARTICIPANT_FIELDS },
  { id: 2, fullName: 'Бегун Два', totalMs: null, lapsMs: [], ...UNKNOWN_PARTICIPANT_FIELDS },
];

/** Data reaches the end of the rows array without a stop row. */
export const TRAILING_DATA_ROWS: string[][] = [['Name'], ['Соло Бегун', '1:00', '', '', '1:00', '2:00']];

export const EXPECTED_TRAILING_PARTICIPANTS: Participant[] = [
  { id: 1, fullName: 'Соло Бегун', totalMs: 60000, lapsMs: [60000, 120000], ...UNKNOWN_PARTICIPANT_FIELDS },
];

export const HEADERLESS_ROWS: string[][] = [['not a header'], []];
