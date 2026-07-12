import { AthleteRun } from '../models/athlete-history.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';

const TWO_LAP_DISTANCE_KM = 2.3;

const run = (dateIso: string, timeMs: number, distanceKm: number = FIVE_KM_DISTANCE_KM): AthleteRun => ({
  dateIso,
  slug: dateIso,
  timeMs,
  distanceKm,
});

/** Eight weekly races, oldest first — the chronology every participation case runs against. */
export const STREAK_EVENT_SLUGS: readonly string[] = [
  '2026-05-03',
  '2026-05-10',
  '2026-05-17',
  '2026-05-24',
  '2026-05-31',
  '2026-06-07',
  '2026-06-14',
  '2026-06-21',
];

/** [label, participationSlugs, expected currentWeeks, expected maxWeeks]. */
export const PARTICIPATION_STREAK_CASES: readonly (readonly [string, readonly string[], number, number])[] = [
  ['no participations — no streaks', [], 0, 0],
  ['every race: one unbroken streak that is still running', [...STREAK_EVENT_SLUGS], 8, 8],
  [
    'a longer early block beats the trailing one, the trailing one is current',
    ['2026-05-03', '2026-05-10', '2026-05-17', '2026-06-14', '2026-06-21'],
    2,
    3,
  ],
  ['missing the latest race drops the current streak to zero', ['2026-05-24', '2026-05-31', '2026-06-07', '2026-06-14'], 0, 4],
  ['a lone visit long ago', ['2026-05-10'], 0, 1],
];

/** Four finishes, each beating the standing best — the baseline plus exactly one completed triple. */
export const RAGE_TRIPLE_RUNS: readonly AthleteRun[] = [
  run('2026-05-03', 1600000),
  run('2026-05-10', 1580000),
  run('2026-05-17', 1560000),
  run('2026-05-24', 1540000),
];

/** Seven straight records after the baseline: two completed triples, the seventh left hanging. */
export const RAGE_DOUBLE_RUNS: readonly AthleteRun[] = [
  run('2026-05-03', 1600000),
  ...Array.from({ length: 7 }, (_, index) => run(`2026-06-${String(index + 1).padStart(2, '0')}`, 1590000 - index * 10000)),
];

/** A slower third finish resets the chain right before it would complete. */
export const RAGE_RESET_RUNS: readonly AthleteRun[] = [
  run('2026-05-03', 1600000),
  run('2026-05-10', 1580000),
  run('2026-05-17', 1560000),
  run('2026-05-24', 1560000),
  run('2026-05-31', 1550000),
];

/** A 2.3 km run sits inside the chain without counting or breaking it; the input is shuffled on purpose. */
export const RAGE_SHORT_COURSE_RUNS: readonly AthleteRun[] = [
  run('2026-05-24', 1540000),
  run('2026-05-03', 1600000),
  run('2026-05-17', 1560000),
  run('2026-05-10', 1580000),
  run('2026-05-20', 700000, TWO_LAP_DISTANCE_KM),
];

/** [label, runs, expected rageCount]. */
export const RAGE_CASES: readonly (readonly [string, readonly AthleteRun[], number])[] = [
  ['no runs — no rage', [], 0],
  ['three records after the baseline earn one «Раж»', RAGE_TRIPLE_RUNS, 1],
  ['seven records in a row earn two, the leftover pair stays open', RAGE_DOUBLE_RUNS, 2],
  ['an equal time is no record and resets the chain', RAGE_RESET_RUNS, 0],
  ['a 2.3 km run neither counts nor breaks the chain, order is restored by date', RAGE_SHORT_COURSE_RUNS, 1],
];
