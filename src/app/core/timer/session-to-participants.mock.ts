import { Gender, GenderConfidence, GenderSource, type GenderType } from '../models/gender.enum';
import { type Participant } from '../models/participant.interface';
import {
  POPOV_ALEKSEY_FINISH_MS,
  POPOV_ALEKSEY_LAP_MS,
  ROMANENKO_LAP_MS,
  SOKOLOVA_FINISH_MS,
  SOKOLOVA_LAP_MS,
  TROILIN_FINISH_MS,
  TROILIN_LAP_MS,
} from './timer-session.mock';

function buildParticipant(
  id: number,
  { fullName, totalMs, lapsMs, gender }: { fullName: string; totalMs: number | null; lapsMs: number[]; gender: GenderType | null },
): Participant {
  return {
    id,
    fullName,
    totalMs,
    lapsMs,
    gender,
    genderConfidence: gender === null ? GenderConfidence.unknown : GenderConfidence.high,
    genderSource: gender === null ? GenderSource.unknown : GenderSource.manual,
    note: '',
    club: '',
  };
}

/**
 * Ids follow the roster order, and each row is one rule of docs/TIMER.md §3: two taps make a
 * finisher with a split lap, «сошёл после круга» makes a 2.3 km row, and one lonely tap, an
 * explicit DNF or no tap at all all end up as a DNF with empty times.
 */
export const EXPECTED_TIMER_PARTICIPANTS: Participant[] = [
  buildParticipant(1, {
    fullName: 'Троилин Антон',
    totalMs: TROILIN_FINISH_MS,
    lapsMs: [TROILIN_LAP_MS, TROILIN_FINISH_MS - TROILIN_LAP_MS],
    gender: Gender.male,
  }),
  buildParticipant(2, {
    fullName: 'Попов Алексей',
    totalMs: POPOV_ALEKSEY_FINISH_MS,
    lapsMs: [POPOV_ALEKSEY_LAP_MS, POPOV_ALEKSEY_FINISH_MS - POPOV_ALEKSEY_LAP_MS],
    gender: Gender.male,
  }),
  buildParticipant(3, { fullName: 'Попов Игорь', totalMs: null, lapsMs: [], gender: Gender.male }),
  buildParticipant(4, { fullName: 'Романенко Елена', totalMs: ROMANENKO_LAP_MS, lapsMs: [ROMANENKO_LAP_MS], gender: Gender.female }),
  buildParticipant(5, {
    fullName: 'Соколова Анна',
    totalMs: SOKOLOVA_FINISH_MS,
    lapsMs: [SOKOLOVA_LAP_MS, SOKOLOVA_FINISH_MS - SOKOLOVA_LAP_MS],
    gender: null,
  }),
  buildParticipant(6, { fullName: 'Иванов Дмитрий', totalMs: null, lapsMs: [], gender: Gender.male }),
  buildParticipant(7, { fullName: 'Кузнецов Пётр', totalMs: null, lapsMs: [], gender: Gender.male }),
];

/** The whole roster before the first tap: everybody is a DNF, nobody has a time. */
export const EXPECTED_UNTIMED_PARTICIPANTS: Participant[] = EXPECTED_TIMER_PARTICIPANTS.map((participant) => ({
  ...participant,
  totalMs: null,
  lapsMs: [],
}));

/** «Только круг» over two taps: the finish is dropped and the lap becomes the whole race. */
export const EXPECTED_LAP_ONLY_TROILIN: Participant = {
  ...EXPECTED_TIMER_PARTICIPANTS[0],
  totalMs: TROILIN_LAP_MS,
  lapsMs: [TROILIN_LAP_MS],
};
