import { AthleteRecord } from '../models/athlete-history.interface';
import { Gender } from '../models/gender.enum';
import { AttendanceRow, SeasonAttendance } from './attendance.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { Season } from './seasons.enum';

const finish = (dateIso: string): { dateIso: string; slug: string; timeMs: number; distanceKm: number } => ({
  dateIso,
  slug: dateIso,
  timeMs: 1500000,
  distanceKm: FIVE_KM_DISTANCE_KM,
});

/**
 * Covers: a two-year regular, a count tie broken by name, a 2.3 km run that never counts, a
 * genderless athlete, a participation-only athlete with no finishes, and a season (spring) nobody
 * ran — the podium of an empty season must be skipped.
 */
export const ATTENDANCE_RECORDS: AthleteRecord[] = [
  {
    key: 'частый фёдор',
    displayName: 'Частый Фёдор',
    gender: Gender.male,
    participationSlugs: ['2025-01-05', '2025-06-01', '2025-06-08', '2025-07-06', '2026-06-07'],
    // Listed out of date order, so the newest-finish reduce takes both of its branches.
    runs: [finish('2025-06-01'), finish('2026-06-07'), finish('2025-01-05'), finish('2025-06-08'), finish('2025-07-06')],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1500000, '2026': 1500000 },
  },
  {
    key: 'вторая вера',
    displayName: 'Вторая Вера',
    gender: Gender.female,
    participationSlugs: ['2025-06-01', '2025-06-08', '2025-07-06'],
    runs: [finish('2025-06-01'), finish('2025-06-08'), finish('2025-07-06')],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1500000 },
  },
  {
    key: 'адамов антон',
    displayName: 'Адамов Антон',
    gender: Gender.male,
    participationSlugs: ['2025-06-01', '2025-06-08', '2025-07-06'],
    runs: [finish('2025-06-01'), finish('2025-06-08'), finish('2025-07-06')],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1500000 },
  },
  {
    key: 'редкий роман',
    displayName: 'Редкий Роман',
    gender: null,
    participationSlugs: ['2025-10-05', '2025-10-12'],
    runs: [finish('2025-10-05'), { dateIso: '2025-10-12', slug: '2025-10-12', timeMs: 600000, distanceKm: TWO_THREE_KM_DISTANCE_KM }],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1500000 },
  },
  {
    key: 'сошедшая софья',
    displayName: 'Сошедшая Софья',
    gender: Gender.female,
    participationSlugs: ['2025-06-01'],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
];

const row = (
  place: number,
  key: string,
  displayName: string,
  gender: AttendanceRow['gender'],
  finishes: number,
  lastDateIso: string,
): AttendanceRow => ({ key, displayName, gender, place, finishes, lastDateIso, lastSlug: lastDateIso });

/** All time: Фёдор alone on five, the three-finish pair sharing second, the single finish fourth. */
export const EXPECTED_ATTENDANCE_BOARD: AttendanceRow[] = [
  row(1, 'частый фёдор', 'Частый Фёдор', Gender.male, 5, '2026-06-07'),
  row(2, 'адамов антон', 'Адамов Антон', Gender.male, 3, '2025-07-06'),
  row(2, 'вторая вера', 'Вторая Вера', Gender.female, 3, '2025-07-06'),
  row(4, 'редкий роман', 'Редкий Роман', null, 1, '2025-10-05'),
];

/** The 2026 cut leaves Фёдор's single June start. */
export const ATTENDANCE_LATE_YEAR = '2026';

export const EXPECTED_LATE_YEAR_BOARD: AttendanceRow[] = [row(1, 'частый фёдор', 'Частый Фёдор', Gender.male, 1, '2026-06-07')];

/** Summer across the whole archive: Фёдор's four Junes and Julys against the three-finish pair. */
export const EXPECTED_SUMMER_BOARD: AttendanceRow[] = [
  row(1, 'частый фёдор', 'Частый Фёдор', Gender.male, 4, '2026-06-07'),
  row(2, 'адамов антон', 'Адамов Антон', Gender.male, 3, '2025-07-06'),
  row(2, 'вторая вера', 'Вторая Вера', Gender.female, 3, '2025-07-06'),
];

/** Nobody ran in spring, so only three of the four season cards survive. */
export const EXPECTED_SEASON_ATTENDANCE: SeasonAttendance[] = [
  { season: Season.winter, rows: [row(1, 'частый фёдор', 'Частый Фёдор', Gender.male, 1, '2025-01-05')] },
  { season: Season.summer, rows: EXPECTED_SUMMER_BOARD },
  { season: Season.autumn, rows: [row(1, 'редкий роман', 'Редкий Роман', null, 1, '2025-10-05')] },
];
