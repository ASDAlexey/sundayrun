import { AthleteRecord, AthleteRun } from '../models/athlete-history.interface';
import { Gender, GenderType } from '../models/gender.enum';
import { CourseRecordHistory } from './course-records.type';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { EventWinnerTimes, RatingRow } from './runner-scores.interface';

export const BOARD_TODAY_ISO = '2026-01-31';

/** One fresh winnered event plus an over-a-year-old one that feeds ranks but never the form. */
export const BOARD_EVENTS: EventWinnerTimes[] = [
  { slug: 'fresh', dateIso: '2026-01-10', bestMaleMs: 1_200_000, bestFemaleMs: 1_500_000 },
  { slug: 'old', dateIso: '2024-06-01', bestMaleMs: 1_200_000, bestFemaleMs: 1_500_000 },
];

/** The standing course records the grades divide by. */
export const BOARD_COURSE_RECORDS: CourseRecordHistory = {
  [Gender.male]: [
    {
      key: 'атлетов андрей',
      displayName: 'Атлетов Андрей',
      gender: Gender.male,
      dateIso: '2024-01-01',
      slug: 'old',
      timeMs: 1_140_000,
      previousMs: null,
    },
  ],
  [Gender.female]: [
    {
      key: 'быстрая вера',
      displayName: 'Быстрая Вера',
      gender: Gender.female,
      dateIso: '2024-01-01',
      slug: 'old',
      timeMs: 1_440_000,
      previousMs: null,
    },
  ],
};

const record = (key: string, displayName: string, gender: GenderType | null, runs: AthleteRun[]): AthleteRecord => ({
  key,
  displayName,
  gender,
  participationSlugs: runs.map((run) => run.slug),
  runs,
  bestMs: runs.length === 0 ? null : Math.min(...runs.map((run) => run.timeMs)),
  bestMsByYear: {},
});

const freshRun = (timeMs: number): AthleteRun => ({ dateIso: '2026-01-10', slug: 'fresh', timeMs, distanceKm: FIVE_KM_DISTANCE_KM });

const oldRun = (timeMs: number): AthleteRun => ({ dateIso: '2024-06-01', slug: 'old', timeMs, distanceKm: FIVE_KM_DISTANCE_KM });

/**
 * Андрей wins the fresh event; Борис, Вера and Давид tie on the form index (96), but Борис drags
 * an old 80-score run that lowers his rank, and the Вера–Давид full tie breaks by name; the
 * genderless, the long-silent and the never-scored athletes never reach the board.
 */
export const BOARD_RECORDS: AthleteRecord[] = [
  record('атлетов андрей', 'Атлетов Андрей', Gender.male, [freshRun(1_200_000)]),
  record('бодрый борис', 'Бодрый Борис', Gender.male, [freshRun(1_250_000), oldRun(1_500_000)]),
  record('быстрая вера', 'Быстрая Вера', Gender.female, [freshRun(1_562_500)]),
  record('дружный давид', 'Дружный Давид', Gender.male, [freshRun(1_250_000)]),
  record('безымянный батыр', 'Безымянный Батыр', null, [freshRun(1_250_000)]),
  record('ветеран венедикт', 'Ветеран Венедикт', Gender.male, [oldRun(1_250_000)]),
  record('пустой пётр', 'Пустой Пётр', Gender.male, []),
];

export const EXPECTED_BOARD: RatingRow[] = [
  {
    key: 'атлетов андрей',
    displayName: 'Атлетов Андрей',
    gender: Gender.male,
    formIndex: 100,
    runnerRank: 100,
    localGrade: 95,
    formRunCount: 1,
  },
  {
    key: 'быстрая вера',
    displayName: 'Быстрая Вера',
    gender: Gender.female,
    formIndex: 96,
    runnerRank: 96,
    localGrade: 92.2,
    formRunCount: 1,
  },
  {
    key: 'дружный давид',
    displayName: 'Дружный Давид',
    gender: Gender.male,
    formIndex: 96,
    runnerRank: 96,
    localGrade: 91.2,
    formRunCount: 1,
  },
  {
    key: 'бодрый борис',
    displayName: 'Бодрый Борис',
    gender: Gender.male,
    formIndex: 96,
    runnerRank: 88,
    localGrade: 91.2,
    formRunCount: 1,
  },
];
