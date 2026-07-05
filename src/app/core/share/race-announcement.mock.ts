import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender } from '../models/gender.enum';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';

export const ANNOUNCEMENT_EVENT_MOCK: RaceEvent = {
  number: 160,
  dateIso: '2020-09-20',
  city: 'г. Таганрог',
  park: 'ПКиО им. Горького',
  clubName: 'КЛБ «Легенда»',
  chairman: 'В.С. Хахуцкий',
};

const MALE_WINNER_ROW: ProtocolRow = {
  index: 1,
  fullName: 'Хахуцкий Виктор',
  time23: '07:57',
  time5: '17:40',
  totalMs: 1060000,
  distanceKm: FIVE_KM_DISTANCE_KM,
  gender: Gender.male,
  placeM: 1,
  placeF: null,
  club: '',
  note: '',
};

const FEMALE_WINNER_ROW: ProtocolRow = {
  index: 2,
  fullName: 'Фарафонова Екатерина',
  time23: '11:04',
  time5: '24:25',
  totalMs: 1465000,
  distanceKm: FIVE_KM_DISTANCE_KM,
  gender: Gender.female,
  placeM: null,
  placeF: 1,
  club: '',
  note: '',
};

/** 2.3 km-only runner: counted as a participant, never a winner. */
const SHORT_DISTANCE_ROW: ProtocolRow = {
  index: 3,
  fullName: 'Куликов Женя',
  time23: '12:30',
  time5: '',
  totalMs: 750000,
  distanceKm: TWO_THREE_KM_DISTANCE_KM,
  gender: null,
  placeM: null,
  placeF: null,
  club: '',
  note: '',
};

/** DNF row: no recorded time, excluded from the participants count. */
const DNF_ROW: ProtocolRow = {
  index: 4,
  fullName: 'Дзюбак Сергей',
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

const HEADER_LINES = 'Воскресный парковый пробег № 160 — 20.09.2020 г.\nПКиО им. Горького, г. Таганрог';

/** [label, protocol rows, expected announcement]. */
export const ANNOUNCEMENT_CASES: readonly (readonly [string, ProtocolRow[], string])[] = [
  [
    'both winners; DNF is not counted',
    [MALE_WINNER_ROW, FEMALE_WINNER_ROW, SHORT_DISTANCE_ROW, DNF_ROW],
    `${HEADER_LINES}\nУчастников: 3\nПобедители: М — Хахуцкий Виктор (17:40), Ж — Фарафонова Екатерина (24:25)`,
  ],
  ['only a male winner', [MALE_WINNER_ROW, DNF_ROW], `${HEADER_LINES}\nУчастников: 1\nПобедители: М — Хахуцкий Виктор (17:40)`],
  ['only a female winner', [FEMALE_WINNER_ROW], `${HEADER_LINES}\nУчастников: 1\nПобедители: Ж — Фарафонова Екатерина (24:25)`],
  ['no winners — the winners line is omitted', [SHORT_DISTANCE_ROW, DNF_ROW], `${HEADER_LINES}\nУчастников: 1`],
];
