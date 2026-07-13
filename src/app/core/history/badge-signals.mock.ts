import { AthleteBadgeSignals, BadgeSignalRun, HistoryRunRow } from './badge-signals.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';

const fiveKm = (dateIso: string, timeMs: number): BadgeSignalRun => ({ dateIso, timeMs, distanceKm: FIVE_KM_DISTANCE_KM });

/**
 * Breaks around the 90-day cut: the first run ever opens no break, the 90-day break counts
 * (2024 is leap, so 2024-04-06 lands exactly 90 days after the opener), the 89-day one does not,
 * and the 185-day winter break makes 2025 a comeback year too.
 */
export const COMEBACK_RUNS: BadgeSignalRun[] = [
  fiveKm('2024-01-07', 1500000),
  fiveKm('2024-04-06', 1500000),
  fiveKm('2024-07-04', 1500000),
  fiveKm('2025-01-05', 1500000),
];

export const EXPECTED_COMEBACK_YEARS = new Set(['2024', '2025']);

/**
 * The all-time 5 km median is 1600000 (the short-course run never joins the sample): one finish
 * per year sits strictly above it, and the run equal to the median never counts as slow. Every
 * break stays under 90 days, so no comeback sneaks in.
 */
export const SLOW_RUNS: BadgeSignalRun[] = [
  fiveKm('2024-10-06', 1500000),
  fiveKm('2024-12-01', 1620000),
  fiveKm('2025-02-02', 1560000),
  fiveKm('2025-04-06', 1600000),
  fiveKm('2025-06-01', 1610000),
  { dateIso: '2025-07-06', timeMs: 999000, distanceKm: TWO_THREE_KM_DISTANCE_KM },
];

export const EXPECTED_SLOW_COUNTS: Record<string, number> = { '2024': 1, '2025': 1 };

/** Both athletes' runs interleaved, as the archive-wide select serves them. */
export const HISTORY_ROWS: HistoryRunRow[] = [
  ...COMEBACK_RUNS.map((run) => ({ ...run, athleteKey: 'anna' })),
  ...SLOW_RUNS.map((run) => ({ ...run, athleteKey: 'boris' })),
].sort((left, right) => left.dateIso.localeCompare(right.dateIso));

export const EXPECTED_SIGNALS_BY_ATHLETE = new Map<string, AthleteBadgeSignals>([
  ['anna', { comebackYears: EXPECTED_COMEBACK_YEARS, slowFinishCountByYear: {} }],
  ['boris', { comebackYears: new Set(), slowFinishCountByYear: EXPECTED_SLOW_COUNTS }],
]);
