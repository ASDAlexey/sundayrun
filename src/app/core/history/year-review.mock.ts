import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { YearBadge } from './year-badges.enum';
import { YearReview, YearReviewSource, YearRunRow } from './year-review.interface';

const IVAN = { key: 'иванов иван', displayName: 'Иванов Иван', gender: Gender.male } as const;

const ANNA = { key: 'петрова анна', displayName: 'Петрова Анна', gender: Gender.female } as const;

const OLEG = { key: 'сидоров олег', displayName: 'Сидоров Олег', gender: null } as const;

const ZOYA = { key: 'смирнова зоя', displayName: 'Смирнова Зоя', gender: Gender.female } as const;

const VERA = { key: 'кузнецова вера', displayName: 'Кузнецова Вера', gender: Gender.female } as const;

const runRow = (
  athlete: typeof ANNA | typeof IVAN | typeof OLEG | typeof VERA | typeof ZOYA,
  dateIso: string,
  timeMs: number,
  distanceKm: number,
): YearRunRow => ({
  ...athlete,
  dateIso,
  slug: dateIso,
  timeMs,
  distanceKm,
});

/**
 * Two events; Иванов and Петрова ran both (the new-year one included), Смирнова, Кузнецова and
 * the genderless Сидоров ran one each, Сидоров on the short course only. Смирнова ties Петрова's
 * best time on the EARLIER date (listed after her, so the tie-break replaces the leader), while
 * Кузнецова ties it again on the later date and must NOT take the best over.
 */
export const YEAR_REVIEW_SOURCE: YearReviewSource = {
  year: '2026',
  eventDates: ['2026-01-04', '2026-01-11'],
  runRows: [
    runRow(IVAN, '2026-01-04', 1500000, FIVE_KM_DISTANCE_KM),
    runRow(IVAN, '2026-01-11', 1440000, FIVE_KM_DISTANCE_KM),
    runRow(ANNA, '2026-01-04', 1680000, FIVE_KM_DISTANCE_KM),
    runRow(ANNA, '2026-01-11', 1620000, FIVE_KM_DISTANCE_KM),
    runRow(ZOYA, '2026-01-04', 1620000, FIVE_KM_DISTANCE_KM),
    runRow(VERA, '2026-01-11', 1620000, FIVE_KM_DISTANCE_KM),
    runRow(OLEG, '2026-01-11', 900000, TWO_THREE_KM_DISTANCE_KM),
  ],
  newcomerCount: 2,
  personalRecordCount: 1,
};

export const EXPECTED_YEAR_REVIEW: YearReview = {
  year: '2026',
  eventCount: 2,
  finishCount: 7,
  finisherCount: 5,
  newcomerCount: 2,
  personalRecordCount: 1,
  // Median of Иванов's two 5 km runs; the short-course run never reaches the medians.
  medianTimeMenMs: 1470000,
  // The women's sample [1680000, 1620000, 1620000, 1620000] averages its middle pair.
  medianTimeWomenMs: 1620000,
  bestMale: { key: IVAN.key, displayName: IVAN.displayName, timeMs: 1440000, slug: '2026-01-11' },
  // The three-way 27:00 tie goes to the earliest run — Смирнова's new-year race.
  bestFemale: { key: ZOYA.key, displayName: ZOYA.displayName, timeMs: 1620000, slug: '2026-01-04' },
  mostActive: [
    { key: IVAN.key, displayName: IVAN.displayName, finishCount: 2 },
    { key: ANNA.key, displayName: ANNA.displayName, finishCount: 2 },
    { key: VERA.key, displayName: VERA.displayName, finishCount: 1 },
    { key: OLEG.key, displayName: OLEG.displayName, finishCount: 1 },
    { key: ZOYA.key, displayName: ZOYA.displayName, finishCount: 1 },
  ],
  badgeHolders: [
    {
      badge: YearBadge.newYearRace,
      holders: [
        { key: IVAN.key, displayName: IVAN.displayName },
        { key: ANNA.key, displayName: ANNA.displayName },
        { key: ZOYA.key, displayName: ZOYA.displayName },
      ],
    },
  ],
  firstEventSlug: '2026-01-04',
};

/** A year that held no races at all — every aggregate collapses to its empty shape. */
export const EMPTY_YEAR_REVIEW_SOURCE: YearReviewSource = {
  year: '2027',
  eventDates: [],
  runRows: [],
  newcomerCount: 0,
  personalRecordCount: 0,
};

export const EXPECTED_EMPTY_YEAR_REVIEW: YearReview = {
  year: '2027',
  eventCount: 0,
  finishCount: 0,
  finisherCount: 0,
  newcomerCount: 0,
  personalRecordCount: 0,
  medianTimeMenMs: null,
  medianTimeWomenMs: null,
  bestMale: null,
  bestFemale: null,
  mostActive: [],
  badgeHolders: [],
  firstEventSlug: null,
};
