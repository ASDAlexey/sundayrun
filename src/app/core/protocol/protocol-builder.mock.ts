import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender, GenderConfidence, GenderSource, GenderType } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import { ProtocolRow } from '../models/protocol-row.interface';

function buildParticipant(
  id: number,
  fullName: string,
  totalMs: number | null,
  lapsMs: (number | null)[],
  gender: GenderType | null,
  club = '',
): Participant {
  return {
    id,
    fullName,
    totalMs,
    lapsMs,
    gender,
    genderConfidence: GenderConfidence.unknown,
    genderSource: GenderSource.unknown,
    note: '',
    club,
  };
}

/** The one row a hand-edited or foreign sheet produces: a total time with no laps under it. */
export const NO_SPLITS_PARTICIPANT_NAME = 'Гостев Семён';

/**
 * Covers: a gender-less fastest finisher (no place), a male tie on total time (stable input order),
 * a finisher without the lap 1 split, 2.3 km-only runners (sorted, no places), two DNF (input order)
 * and a timed participant with no splits at all, which neither distance can claim.
 *
 * Appended, never inserted: `auto-note-input.mock.ts` addresses this roster by index.
 */
export const PROTOCOL_PARTICIPANTS: Participant[] = [
  buildParticipant(1, 'Иванов Иван', 1398000, [660000, 738000], Gender.male, 'Парсек'),
  buildParticipant(2, 'Петрова Анна', 1500000, [720000, 780000], Gender.female),
  buildParticipant(3, 'Сидоров Пётр', 1398000, [700000, 698000], Gender.male),
  buildParticipant(4, 'Безымянный Атлет', 1200000, [590000, 610000], null),
  buildParticipant(5, 'Козлова Мария', 1600000, [null, 780000], Gender.female),
  buildParticipant(6, 'Новиков Олег', 690000, [690000], Gender.male),
  buildParticipant(7, 'Быстрова Яна', 600000, [600000], Gender.female),
  buildParticipant(8, 'Сошедший Первый', null, [660000], Gender.male),
  buildParticipant(9, 'Сошедшая Вторая', null, [], Gender.female),
  buildParticipant(10, NO_SPLITS_PARTICIPANT_NAME, 1450000, [], Gender.male),
];

/**
 * The same protocol as the stopwatch hands it over: every reading is milliseconds off the session
 * journal. The 2.3 km column has hundredths to show here, so it keeps them — including on the lap
 * that happens to land on a whole second, which follows its column rather than its own value.
 */
export const TIMED_PARTICIPANTS: Participant[] = [
  buildParticipant(1, 'Троилин Антон', 1165061, [528310, 636751], Gender.male),
  buildParticipant(2, 'Хандыго Наталья', 1928450, [949000, 979450], Gender.female),
];

export const EXPECTED_TIMED_LAP_TEXTS = ['8:48,31', '15:49,00'];

export const EXPECTED_TIMED_FINISH_TEXTS = ['19:25,06', '32:08,45'];

/**
 * Neither distance claimed this one, so it lands in the tail in input order, after both DNF, and is
 * drawn like them: no time, no distance, no place. The point is that it is drawn at all.
 */
export const EXPECTED_NO_SPLITS_ROW: ProtocolRow = {
  index: 10,
  fullName: NO_SPLITS_PARTICIPANT_NAME,
  time23: '',
  time5: '',
  totalMs: null,
  distanceKm: null,
  gender: Gender.male,
  placeM: null,
  placeF: null,
  club: '',
  note: '',
};

export const EXPECTED_PROTOCOL_ROWS: ProtocolRow[] = [
  {
    index: 1,
    fullName: 'Безымянный Атлет',
    time23: '9:50',
    time5: '20:00,00',
    totalMs: 1200000,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender: null,
    placeM: null,
    placeF: null,
    club: '',
    note: '',
  },
  {
    index: 2,
    fullName: 'Иванов Иван',
    time23: '11:00',
    time5: '23:18,00',
    totalMs: 1398000,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender: Gender.male,
    placeM: 1,
    placeF: null,
    club: 'Парсек',
    note: '',
  },
  {
    index: 3,
    fullName: 'Сидоров Пётр',
    time23: '11:40',
    time5: '23:18,00',
    totalMs: 1398000,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender: Gender.male,
    placeM: 2,
    placeF: null,
    club: '',
    note: '',
  },
  {
    index: 4,
    fullName: 'Петрова Анна',
    time23: '12:00',
    time5: '25:00,00',
    totalMs: 1500000,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender: Gender.female,
    placeM: null,
    placeF: 1,
    club: '',
    note: '',
  },
  {
    index: 5,
    fullName: 'Козлова Мария',
    time23: '',
    time5: '26:40,00',
    totalMs: 1600000,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender: Gender.female,
    placeM: null,
    placeF: 2,
    club: '',
    note: '',
  },
  {
    index: 6,
    fullName: 'Быстрова Яна',
    time23: '10:00',
    time5: '',
    totalMs: 600000,
    distanceKm: TWO_THREE_KM_DISTANCE_KM,
    gender: Gender.female,
    placeM: null,
    placeF: null,
    club: '',
    note: '',
  },
  {
    index: 7,
    fullName: 'Новиков Олег',
    time23: '11:30',
    time5: '',
    totalMs: 690000,
    distanceKm: TWO_THREE_KM_DISTANCE_KM,
    gender: Gender.male,
    placeM: null,
    placeF: null,
    club: '',
    note: '',
  },
  {
    index: 8,
    fullName: 'Сошедший Первый',
    time23: '',
    time5: '',
    totalMs: null,
    distanceKm: null,
    gender: Gender.male,
    placeM: null,
    placeF: null,
    club: '',
    note: '',
  },
  {
    index: 9,
    fullName: 'Сошедшая Вторая',
    time23: '',
    time5: '',
    totalMs: null,
    distanceKm: null,
    gender: Gender.female,
    placeM: null,
    placeF: null,
    club: '',
    note: '',
  },
  EXPECTED_NO_SPLITS_ROW,
];
