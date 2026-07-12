import { Gender } from '../models/gender.enum';
import { AthletesHistory } from '../models/athletes-history.type';
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

/** [label, input, course year best (same gender, before this result), expected note] against `NOTES_HISTORY`. */
export const AUTO_NOTE_CASES: readonly (readonly [string, AutoNoteInput, number | null, string])[] = [
  [
    'DNF never gets a note',
    { key: 'иванов иван', gender: Gender.male, timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    null,
    '',
  ],
  [
    'unknown athlete with a time',
    { key: 'новичок новый', gender: Gender.male, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    1400000,
    FIRST_PARTICIPATION_NOTE,
  ],
  [
    'known record without runs',
    { key: 'пустой бегун', gender: null, timeMs: 690000, distanceKm: TWO_THREE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    null,
    FIRST_PARTICIPATION_NOTE,
  ],
  [
    '2.3 km with an existing record',
    { key: 'иванов иван', gender: Gender.male, timeMs: 600000, distanceKm: TWO_THREE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    null,
    '',
  ],
  [
    'all-time personal record without a beaten year best',
    { key: 'иванов иван', gender: Gender.male, timeMs: 1440000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    1400000,
    'ЛР (было 25:00)',
  ],
  [
    'personal record combined with the year best',
    { key: 'иванов иван', gender: Gender.male, timeMs: 1440000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    1450000,
    'ЛР (было 25:00); Лучший результат 2026 г.',
  ],
  [
    'better than the year best but not the all-time best',
    { key: 'иванов иван', gender: Gender.male, timeMs: 1520000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    1530000,
    'Лучший результат 2026 г.',
  ],
  [
    'equal to the year best is not an improvement',
    { key: 'иванов иван', gender: Gender.male, timeMs: 1520000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    1520000,
    '',
  ],
  [
    'no year best to beat yet (first 5 km of the year among the gender)',
    { key: 'иванов иван', gender: Gender.male, timeMs: 1520000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2027-01-02' },
    null,
    '',
  ],
  [
    'worse than every best',
    { key: 'иванов иван', gender: Gender.male, timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    1500000,
    '',
  ],
  [
    'first 5 km with a 2.3 km-only history beats the year best without a personal record',
    { key: 'спринтер дистанций', gender: Gender.female, timeMs: 1350000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: '2026-07-04' },
    1400000,
    'Лучший результат 2026 г.',
  ],
];
