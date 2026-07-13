import { AthleteRun } from '../models/athlete-history.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { AthleteRating, EventWinnerTimes, ScoredRun } from './runner-scores.interface';

/** The anchor day of every form-index expectation. */
export const SCORES_TODAY_ISO = '2026-01-31';

/**
 * Three winnered events around the anchor: an over-a-year-old one (rank only), a mid-window one
 * without a single female finisher, and a fresh one. The `unknown` slug stays off the list.
 */
export const WINNER_EVENTS: EventWinnerTimes[] = [
  { slug: 'e-2025-01-01', dateIso: '2025-01-01', bestMaleMs: 1_200_000, bestFemaleMs: 1_500_000 },
  { slug: 'e-2025-06-01', dateIso: '2025-06-01', bestMaleMs: 1_200_000, bestFemaleMs: null },
  { slug: 'e-2026-01-01', dateIso: '2026-01-01', bestMaleMs: 1_140_000, bestFemaleMs: 1_440_000 },
];

/** A runless race on the anchor day: appending it moves the `newestEventIso` anchor there. */
export const ANCHOR_EVENT: EventWinnerTimes = { slug: 'e-anchor', dateIso: SCORES_TODAY_ISO, bestMaleMs: 1_200_000, bestFemaleMs: null };

const run = (dateIso: string, slug: string, timeMs: number, distanceKm = FIVE_KM_DISTANCE_KM): AthleteRun => ({
  dateIso,
  slug,
  timeMs,
  distanceKm,
});

/**
 * A male scan covering every drop: the one-lap run and the unknown event score nothing, the rest
 * score 80, 96 and 100 (the athlete wins the fresh event) — listed newest first to prove the sort.
 */
export const MALE_RUNS: AthleteRun[] = [
  run('2026-01-01', 'e-2026-01-01', 1_140_000),
  run('2026-01-01', 'e-2026-01-01', 660_000, TWO_THREE_KM_DISTANCE_KM),
  run('2025-06-01', 'e-2025-06-01', 1_250_000),
  run('2025-06-01', 'unknown', 1_250_000),
  run('2025-01-01', 'e-2025-01-01', 1_500_000),
];

export const EXPECTED_MALE_SCORED: ScoredRun[] = [
  { dateIso: '2025-01-01', slug: 'e-2025-01-01', timeMs: 1_500_000, score: 80 },
  { dateIso: '2025-06-01', slug: 'e-2025-06-01', timeMs: 1_250_000, score: 96 },
  { dateIso: '2026-01-01', slug: 'e-2026-01-01', timeMs: 1_140_000, score: 100 },
];

/** The average of all three scores; the year-old 80 anchors the rank but not the form. */
export const EXPECTED_MALE_RANK = 92;

/**
 * Only the window runs feed the form: 96 aged 244 days (weight 486/730) and 100 aged 30 days
 * (weight 700/730) — the weighted average lands at 98.4, above the plain 98.
 */
export const EXPECTED_MALE_FORM_INDEX = 98.4;

/** The full card against a 1_100_000 course record: the 1_140_000 best grades at 96.5. */
export const MALE_COURSE_RECORD_MS = 1_100_000;

export const EXPECTED_MALE_RATING: AthleteRating = {
  runnerRank: EXPECTED_MALE_RANK,
  formIndex: EXPECTED_MALE_FORM_INDEX,
  localGrade: 96.5,
  scoredCount: 3,
  formRunCount: 2,
};

export const EMPTY_RATING: AthleteRating = { runnerRank: null, formIndex: null, localGrade: null, scoredCount: 0, formRunCount: 0 };

/** Six same-day scores 100…50 — the top-count cut keeps five: (100+96+80+75+60)/5 = 82.2. */
export const TRIM_EVENTS: EventWinnerTimes[] = ['t1', 't2', 't3', 't4', 't5', 't6'].map((slug) => ({
  slug,
  dateIso: SCORES_TODAY_ISO,
  bestMaleMs: 1_200_000,
  bestFemaleMs: null,
}));

export const TRIM_RUNS: AthleteRun[] = [
  run(SCORES_TODAY_ISO, 't1', 1_200_000),
  run(SCORES_TODAY_ISO, 't2', 1_250_000),
  run(SCORES_TODAY_ISO, 't3', 1_500_000),
  run(SCORES_TODAY_ISO, 't4', 1_600_000),
  run(SCORES_TODAY_ISO, 't5', 2_000_000),
  run(SCORES_TODAY_ISO, 't6', 2_400_000),
];

export const EXPECTED_TRIM_FORM_INDEX = 82.2;
