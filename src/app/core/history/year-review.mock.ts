import { Gender } from '../models/gender.enum';
import { HistoryRunRow } from './badge-signals.interface';
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

const YEAR_RUN_ROWS: YearRunRow[] = [
  // Иванов's runs arrive newest-first: the slower January opener must not displace his 24:00 best.
  runRow(IVAN, '2026-01-11', 1440000, FIVE_KM_DISTANCE_KM),
  runRow(IVAN, '2026-01-04', 1500000, FIVE_KM_DISTANCE_KM),
  // Петрова's equal 27:00s arrive newest-first, so the best-of-year tie-break must keep the earlier run.
  runRow(ANNA, '2026-01-11', 1620000, FIVE_KM_DISTANCE_KM),
  runRow(ANNA, '2026-01-04', 1620000, FIVE_KM_DISTANCE_KM),
  runRow(ZOYA, '2026-01-04', 1620000, FIVE_KM_DISTANCE_KM),
  runRow(VERA, '2026-01-11', 1620000, FIVE_KM_DISTANCE_KM),
  runRow(OLEG, '2026-01-11', 900000, TWO_THREE_KM_DISTANCE_KM),
];

const historyRow = (row: YearRunRow): HistoryRunRow => ({
  athleteKey: row.key,
  dateIso: row.dateIso,
  timeMs: row.timeMs,
  distanceKm: row.distanceKm,
});

/**
 * Two events; Иванов and Петрова ran both (the new-year one included), Смирнова, Кузнецова and
 * the genderless Сидоров ran one each, Сидоров on the short course only. The three women tie at
 * 27:00 season bests, so the best-results board ranks them alphabetically. The history carries
 * one extra pre-season run: Кузнецова's September opener puts a 126-day break before her 2026
 * finish — a comeback.
 */
export const YEAR_REVIEW_SOURCE: YearReviewSource = {
  year: '2026',
  eventDates: ['2026-01-04', '2026-01-11'],
  runRows: YEAR_RUN_ROWS,
  historyRows: [
    { athleteKey: VERA.key, dateIso: '2025-09-07', timeMs: 1620000, distanceKm: FIVE_KM_DISTANCE_KM },
    ...YEAR_RUN_ROWS.map(historyRow),
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
  // The women's sample is four equal 27:00s, so the median is 27:00.
  medianTimeWomenMs: 1620000,
  bestMen: [{ key: IVAN.key, displayName: IVAN.displayName, timeMs: 1440000, dateIso: '2026-01-11', slug: '2026-01-11' }],
  // The three-way 27:00 tie of season bests ranks by name; Петрова's own tie resolves to her earlier run.
  bestWomen: [
    { key: VERA.key, displayName: VERA.displayName, timeMs: 1620000, dateIso: '2026-01-11', slug: '2026-01-11' },
    { key: ANNA.key, displayName: ANNA.displayName, timeMs: 1620000, dateIso: '2026-01-04', slug: '2026-01-04' },
    { key: ZOYA.key, displayName: ZOYA.displayName, timeMs: 1620000, dateIso: '2026-01-04', slug: '2026-01-04' },
  ],
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
    {
      badge: YearBadge.comeback,
      holders: [{ key: VERA.key, displayName: VERA.displayName }],
    },
  ],
  firstEventSlug: '2026-01-04',
};

/** A year that held no races at all — every aggregate collapses to its empty shape. */
export const EMPTY_YEAR_REVIEW_SOURCE: YearReviewSource = {
  year: '2027',
  eventDates: [],
  runRows: [],
  historyRows: [],
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
  bestMen: [],
  bestWomen: [],
  mostActive: [],
  badgeHolders: [],
  firstEventSlug: null,
};
