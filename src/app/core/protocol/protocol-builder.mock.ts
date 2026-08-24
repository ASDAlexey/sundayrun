import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender, GenderConfidence, GenderSource, type GenderType } from '../models/gender.enum';
import { type Participant } from '../models/participant.interface';
import { type ProtocolRow } from '../models/protocol-row.interface';

function buildParticipant(
  id: number,
  {
    fullName,
    totalMs,
    lapsMs,
    gender,
    club = '',
  }: { fullName: string; totalMs: number | null; lapsMs: (number | null)[]; gender: GenderType | null; club?: string },
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
  buildParticipant(1, { fullName: 'Иванов Иван', totalMs: 1398000, lapsMs: [660000, 738000], gender: Gender.male, club: 'Парсек' }),
  buildParticipant(2, { fullName: 'Петрова Анна', totalMs: 1500000, lapsMs: [720000, 780000], gender: Gender.female }),
  buildParticipant(3, { fullName: 'Сидоров Пётр', totalMs: 1398000, lapsMs: [700000, 698000], gender: Gender.male }),
  buildParticipant(4, { fullName: 'Безымянный Атлет', totalMs: 1200000, lapsMs: [590000, 610000], gender: null }),
  buildParticipant(5, { fullName: 'Козлова Мария', totalMs: 1600000, lapsMs: [null, 780000], gender: Gender.female }),
  buildParticipant(6, { fullName: 'Новиков Олег', totalMs: 690000, lapsMs: [690000], gender: Gender.male }),
  buildParticipant(7, { fullName: 'Быстрова Яна', totalMs: 600000, lapsMs: [600000], gender: Gender.female }),
  buildParticipant(8, { fullName: 'Сошедший Первый', totalMs: null, lapsMs: [660000], gender: Gender.male }),
  buildParticipant(9, { fullName: 'Сошедшая Вторая', totalMs: null, lapsMs: [], gender: Gender.female }),
  buildParticipant(10, { fullName: NO_SPLITS_PARTICIPANT_NAME, totalMs: 1450000, lapsMs: [], gender: Gender.male }),
];

/**
 * The same protocol as the stopwatch hands it over: every reading is milliseconds off the session
 * journal. The 2.3 km column has hundredths to show here, so it keeps them — including on the lap
 * that happens to land on a whole second, which follows its column rather than its own value.
 */
export const TIMED_PARTICIPANTS: Participant[] = [
  buildParticipant(1, { fullName: 'Троилин Антон', totalMs: 1165061, lapsMs: [528310, 636751], gender: Gender.male }),
  buildParticipant(2, { fullName: 'Хандыго Наталья', totalMs: 1928450, lapsMs: [949000, 979450], gender: Gender.female }),
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
