import { Gender, GenderConfidence, GenderSource, GenderType } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import {
  POPOV_ALEKSEY_FINISH_MS,
  POPOV_ALEKSEY_LAP_MS,
  ROMANENKO_LAP_MS,
  SOKOLOVA_FINISH_MS,
  SOKOLOVA_LAP_MS,
  TROILIN_FINISH_MS,
  TROILIN_LAP_MS,
} from './timer-session.mock';

function buildParticipant(id: number, fullName: string, totalMs: number | null, lapsMs: number[], gender: GenderType | null): Participant {
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
  buildParticipant(1, 'Троилин Антон', TROILIN_FINISH_MS, [TROILIN_LAP_MS, TROILIN_FINISH_MS - TROILIN_LAP_MS], Gender.male),
  buildParticipant(
    2,
    'Попов Алексей',
    POPOV_ALEKSEY_FINISH_MS,
    [POPOV_ALEKSEY_LAP_MS, POPOV_ALEKSEY_FINISH_MS - POPOV_ALEKSEY_LAP_MS],
    Gender.male,
  ),
  buildParticipant(3, 'Попов Игорь', null, [], Gender.male),
  buildParticipant(4, 'Романенко Елена', ROMANENKO_LAP_MS, [ROMANENKO_LAP_MS], Gender.female),
  buildParticipant(5, 'Соколова Анна', SOKOLOVA_FINISH_MS, [SOKOLOVA_LAP_MS, SOKOLOVA_FINISH_MS - SOKOLOVA_LAP_MS], null),
  buildParticipant(6, 'Иванов Дмитрий', null, [], Gender.male),
  buildParticipant(7, 'Кузнецов Пётр', null, [], Gender.male),
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
