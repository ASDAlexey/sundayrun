import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { YearBadge } from './year-badges.enum';
import { YearReview, YearReviewSource, YearRunRow } from './year-review.interface';

const IVAN = { key: 'иванов иван', displayName: 'Иванов Иван', gender: Gender.male } as const;

const ANNA = { key: 'петрова анна', displayName: 'Петрова Анна', gender: Gender.female } as const;

const OLEG = { key: 'сидоров олег', displayName: 'Сидоров Олег', gender: null } as const;

const runRow = (athlete: typeof IVAN | typeof ANNA | typeof OLEG, dateIso: string, timeMs: number, distanceKm: number): YearRunRow => ({
  ...athlete,
  dateIso,
  slug: dateIso,
  timeMs,
  distanceKm,
});

/**
 * Two events; Иванов ran both (the new-year one included), Петрова and the genderless Сидоров
 * ran one each, Сидоров on the short course only.
 */
export const YEAR_REVIEW_SOURCE: YearReviewSource = {
  year: '2026',
  eventDates: ['2026-01-04', '2026-01-11'],
  runRows: [
    runRow(IVAN, '2026-01-04', 1500000, FIVE_KM_DISTANCE_KM),
    runRow(IVAN, '2026-01-11', 1440000, FIVE_KM_DISTANCE_KM),
    runRow(ANNA, '2026-01-11', 1620000, FIVE_KM_DISTANCE_KM),
    runRow(OLEG, '2026-01-11', 900000, TWO_THREE_KM_DISTANCE_KM),
  ],
  newcomerCount: 2,
  personalRecordCount: 1,
};

export const EXPECTED_YEAR_REVIEW: YearReview = {
  year: '2026',
  eventCount: 2,
  finishCount: 4,
  finisherCount: 3,
  newcomerCount: 2,
  personalRecordCount: 1,
  // Median of Иванов's two 5 km runs; the short-course run never reaches the medians.
  medianTimeMenMs: 1470000,
  medianTimeWomenMs: 1620000,
  bestMale: { key: IVAN.key, displayName: IVAN.displayName, timeMs: 1440000, slug: '2026-01-11' },
  bestFemale: { key: ANNA.key, displayName: ANNA.displayName, timeMs: 1620000, slug: '2026-01-11' },
  mostActive: [
    { key: IVAN.key, displayName: IVAN.displayName, finishCount: 2 },
    { key: ANNA.key, displayName: ANNA.displayName, finishCount: 1 },
    { key: OLEG.key, displayName: OLEG.displayName, finishCount: 1 },
  ],
  badgeHolders: [{ badge: YearBadge.newYearRace, holders: [{ key: IVAN.key, displayName: IVAN.displayName }] }],
  firstEventSlug: '2026-01-04',
};
