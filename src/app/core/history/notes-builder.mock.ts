import { Gender } from '../models/gender.enum';
import { AthletesHistory } from '../models/athletes-history.type';
import { EventRef, EventResult } from './athletes-rollup.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { FIRST_PARTICIPATION_NOTE } from './notes-builder.constant';
import { AutoNoteInput } from './notes-builder.interface';

/** Hand-built history: an athlete with 5 km bests, a DNF-only record without runs, an athlete with 2.3 km runs only. */
export const NOTES_HISTORY: AthletesHistory = {
  'иванов иван': {
    key: 'иванов иван',
    displayName: 'Иванов Иван',
    gender: Gender.male,
    participationSlugs: ['kuzminki-1', 'kuzminki-2'],
    runs: [
      { dateIso: '2025-12-27', slug: 'kuzminki-1', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-01-03', slug: 'kuzminki-2', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1500000, '2026': 1560000 },
  },
  'пустой бегун': {
    key: 'пустой бегун',
    displayName: 'Пустой Бегун',
    gender: null,
    participationSlugs: ['kuzminki-1'],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
  'спринтер дистанций': {
    key: 'спринтер дистанций',
    displayName: 'Спринтер Дистанций',
    gender: Gender.female,
    participationSlugs: ['kuzminki-2'],
    runs: [{ dateIso: '2026-01-03', slug: 'kuzminki-2', timeMs: 690000, distanceKm: TWO_THREE_KM_DISTANCE_KM }],
    bestMs: null,
    bestMsByYear: {},
  },
};

/** [label, input, expected note] computed against `NOTES_HISTORY`. */
export const AUTO_NOTE_CASES: readonly (readonly [string, AutoNoteInput, string])[] = [
  ['DNF never gets a note', { key: 'иванов иван', timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' }, ''],
  [
    'unknown athlete with a time',
    { key: 'новичок новый', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    FIRST_PARTICIPATION_NOTE,
  ],
  [
    'known record without runs',
    { key: 'пустой бегун', timeMs: 690000, distanceKm: TWO_THREE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    FIRST_PARTICIPATION_NOTE,
  ],
  [
    '2.3 km with an existing record',
    { key: 'иванов иван', timeMs: 600000, distanceKm: TWO_THREE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    '',
  ],
  [
    'all-time personal record',
    { key: 'иванов иван', timeMs: 1440000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    'ЛР (было 25:00)',
  ],
  [
    'better than the year best but not the all-time best',
    { key: 'иванов иван', timeMs: 1520000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    'Лучший результат 2026 г.',
  ],
  [
    'equal to the all-time best is not a personal record',
    { key: 'иванов иван', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    'Лучший результат 2026 г.',
  ],
  [
    'first 5 km run of a new year (year boundary)',
    { key: 'иванов иван', timeMs: 1700000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2027-01-02' },
    'Лучший результат 2027 г.',
  ],
  ['worse than both bests', { key: 'иванов иван', timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' }, ''],
  [
    'first 5 km with a 2.3 km-only history',
    { key: 'спринтер дистанций', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    'Лучший результат 2026 г.',
  ],
];

export const SEASON_OPENER_EVENT: EventRef = { slug: 'kuzminki-1', dateIso: '2025-12-27' };

export const SEASON_OPENER_RESULTS: EventResult[] = [
  { fullName: 'Иванов Иван', gender: Gender.male, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
  { fullName: 'Петрова Анна', gender: Gender.female, timeMs: 1620000, distanceKm: FIVE_KM_DISTANCE_KM },
];

/** [label, input, expected note] for the next event ('2026-01-03') after rolling up the season opener. */
export const NEXT_EVENT_NOTE_CASES: readonly (readonly [string, AutoNoteInput, string])[] = [
  [
    'repeat runner improving',
    { key: 'иванов иван', timeMs: 1440000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-01-03' },
    'ЛР (было 25:00)',
  ],
  [
    'repeat runner slower in a new year gets the year best note',
    { key: 'петрова анна', timeMs: 1680000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-01-03' },
    'Лучший результат 2026 г.',
  ],
  ['newcomer', { key: 'новикова юлия', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-01-03' }, FIRST_PARTICIPATION_NOTE],
];
