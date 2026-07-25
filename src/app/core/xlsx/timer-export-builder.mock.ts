import { GenderConfidence, GenderSource } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import { TIMER_EXPORT_HEADER_ROW } from './timer-export-builder.constant';

/** Fields the parser always fills in itself — they never survive a round trip through the file. */
export const EXPECTED_PARSED_UNKNOWN_FIELDS = {
  gender: null,
  genderConfidence: GenderConfidence.unknown,
  genderSource: GenderSource.unknown,
  note: '',
  club: '',
};

/**
 * A 5 km finisher, a 2.3 km runner, a DNF, a millisecond-precise participant whose name carries
 * every XML special character, and a finisher whose lap 1 split was not recorded (`null` lap).
 * Names are already in display case, so `normalizeFullNameCase` leaves them alone on re-read —
 * that is what makes the round trip exact.
 */
export const EXPORT_PARTICIPANTS: Participant[] = [
  { id: 1, fullName: 'Троилин Антон', totalMs: 1143028, lapsMs: [509705, 633323], ...EXPECTED_PARSED_UNKNOWN_FIELDS },
  { id: 2, fullName: 'Ковшова Ирина', totalMs: 1044841, lapsMs: [1044841], ...EXPECTED_PARSED_UNKNOWN_FIELDS },
  { id: 3, fullName: 'Бегун Два', totalMs: null, lapsMs: [], ...EXPECTED_PARSED_UNKNOWN_FIELDS },
  { id: 4, fullName: 'Иванов &<>"\' Ко', totalMs: 3600007, lapsMs: [1800003, 1800004], ...EXPECTED_PARSED_UNKNOWN_FIELDS },
  { id: 5, fullName: 'Дзюбак Сергей', totalMs: 1200000, lapsMs: [null, 620000], ...EXPECTED_PARSED_UNKNOWN_FIELDS },
];

/** Header plus one row per participant of `EXPORT_PARTICIPANTS`. */
export const EXPECTED_EXPORT_ROWS: string[][] = [
  [...TIMER_EXPORT_HEADER_ROW],
  ['Троилин Антон', '19:03,028', '9:31,514', '3:48,606', '8:29,705', '10:33,323'],
  ['Ковшова Ирина', '17:24,841', '17:24,841', '7:34,279', '17:24,841', ''],
  ['Бегун Два', '', '', '', '', ''],
  ['Иванов &<>"\' Ко', '1:00:00,007', '30:00,004', '12:00,001', '30:00,003', '30:00,004'],
  ['Дзюбак Сергей', '20:00,000', '20:00,000', '8:41,739', '', '10:20,000'],
];

/** Beyond 26 rows the worksheet needs correct row numbers for every participant to come back. */
export const LONG_ROSTER_SIZE = 30;

const LONG_ROSTER_BASE_MS = 1_200_000;

const LONG_ROSTER_STEP_MS = 1_137;

const LONG_ROSTER_FIRST_LAP_MS = 509_705;

export const LONG_ROSTER_PARTICIPANTS: Participant[] = Array.from({ length: LONG_ROSTER_SIZE }, (_unused, index) =>
  buildRosterParticipant(index),
);

function buildRosterParticipant(index: number): Participant {
  const totalMs = LONG_ROSTER_BASE_MS + index * LONG_ROSTER_STEP_MS;

  return {
    id: index + 1,
    fullName: `Бегун ${index}`,
    totalMs,
    lapsMs: [LONG_ROSTER_FIRST_LAP_MS, totalMs - LONG_ROSTER_FIRST_LAP_MS],
    ...EXPECTED_PARSED_UNKNOWN_FIELDS,
  };
}
