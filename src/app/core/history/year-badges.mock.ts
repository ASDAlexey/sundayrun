import { AthleteRun } from '../models/athlete-history.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { AthleteYearBadges, YearActivity } from './year-badges';
import { YearBadge, YearBadgeType } from './year-badges.enum';

const run = (dateIso: string): AthleteRun => ({ dateIso, slug: dateIso, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM });

const pad = (value: number): string => String(value).padStart(2, '0');

/** Year → its first race, the new-year one. */
export const FIRST_EVENT_DATE_BY_YEAR: Record<string, string> = { '2024': '2024-01-07', '2025': '2025-01-05', '2026': '2026-01-04' };

/** 2025: one run in each of the 12 months (January = the year's first race) plus 18 more March dates → exactly 30. */
const BRONZE_2025_RUNS: AthleteRun[] = [
  ...Array.from({ length: 12 }, (_, month) => run(`2025-${pad(month + 1)}-${month === 0 ? '05' : '15'}`)),
  ...Array.from({ length: 18 }, (_, day) => run(`2025-03-${pad(day + 1)}`)),
];

/** 2026: 50 runs packed into May–June, skipping the year's first race → the gold tier alone. */
const GOLD_2026_RUNS: AthleteRun[] = [
  ...Array.from({ length: 31 }, (_, day) => run(`2026-05-${pad(day + 1)}`)),
  ...Array.from({ length: 19 }, (_, day) => run(`2026-06-${pad(day + 1)}`)),
];

/** 2024: a couple of runs — no badge, the year is omitted entirely. */
const QUIET_2024_RUNS: AthleteRun[] = [run('2024-10-06'), run('2024-10-13')];

export const MULTI_YEAR_RUNS: AthleteRun[] = [...QUIET_2024_RUNS, ...BRONZE_2025_RUNS, ...GOLD_2026_RUNS];

/** Newest year first; 2024 earned nothing and is dropped. */
export const EXPECTED_MULTI_YEAR_BADGES: AthleteYearBadges[] = [
  { year: '2026', badges: [YearBadge.obsessiveGold] },
  { year: '2025', badges: [YearBadge.obsessiveBronze, YearBadge.allMonths, YearBadge.newYearRace] },
];

/**
 * The ranking crowns: a 2025 crown to lead that year's row, a 2024 cut reviving the quiet year,
 * and a run-less 2023 cut — the standing course record can outlive the runs behind it.
 */
export const RANK_BADGES_BY_YEAR: Record<string, YearBadgeType[]> = {
  '2025': [YearBadge.yearKing],
  '2024': [YearBadge.yearTopThirty],
  '2023': [YearBadge.courseKing],
};

/** The rank badges lead their years, and the run-less years resurface carrying their crowns alone. */
export const EXPECTED_RANKED_MULTI_YEAR_BADGES: AthleteYearBadges[] = [
  { year: '2026', badges: [YearBadge.obsessiveGold] },
  { year: '2025', badges: [YearBadge.yearKing, YearBadge.obsessiveBronze, YearBadge.allMonths, YearBadge.newYearRace] },
  { year: '2024', badges: [YearBadge.yearTopThirty] },
  { year: '2023', badges: [YearBadge.courseKing] },
];

/** 2025 sliced out of the multi-year runs: 30 finishes over all 12 months starting at the new-year race. */
export const EXPECTED_2025_ACTIVITY: YearActivity = { runCount: 30, monthCount: 12, ranNewYearRace: true };

/** A year the athlete never ran. */
export const EMPTY_YEAR_ACTIVITY: YearActivity = { runCount: 0, monthCount: 0, ranNewYearRace: false };

/** [label, activity, expected badges] for the single-year criteria. */
export const YEAR_ACTIVITY_CASES: readonly (readonly [string, YearActivity, YearBadgeType[]])[] = [
  ['49 runs stay silver', { runCount: 49, monthCount: 3, ranNewYearRace: false }, [YearBadge.obsessiveSilver]],
  ['40 runs earn silver', { runCount: 40, monthCount: 3, ranNewYearRace: false }, [YearBadge.obsessiveSilver]],
  ['30 runs earn bronze', { runCount: 30, monthCount: 3, ranNewYearRace: false }, [YearBadge.obsessiveBronze]],
  ['29 runs earn no tier', { runCount: 29, monthCount: 3, ranNewYearRace: false }, []],
  ['every month without a tier', { runCount: 12, monthCount: 12, ranNewYearRace: false }, [YearBadge.allMonths]],
  ['the new-year race alone', { runCount: 1, monthCount: 1, ranNewYearRace: true }, [YearBadge.newYearRace]],
];
