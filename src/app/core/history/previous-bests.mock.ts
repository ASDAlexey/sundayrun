import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { type ParticipantRun } from './notables.interface';
import { type PreviousBest } from './previous-bests.interface';

export const PREVIOUS_BESTS_EVENT_DATE = '2025-04-27';

const run = (
  athleteKey: string,
  { dateIso, timeMs, distanceKm = FIVE_KM_DISTANCE_KM }: { dateIso: string; timeMs: number; distanceKm?: number },
): ParticipantRun => ({
  athleteKey,
  dateIso,
  slug: dateIso,
  timeMs,
  distanceKm,
});

/**
 * Every skip and pick branch on one list: the same-date and later runs are cut, the one-lap run
 * never counts, a slower run never replaces the best, a faster one does, and a time tie stays
 * with the earlier run.
 */
export const PREVIOUS_BESTS_RUNS: ParticipantRun[] = [
  run('попов алексей', { dateIso: '2025-01-12', timeMs: 1252000 }),
  run('попов алексей', { dateIso: '2025-02-09', timeMs: 1310000 }),
  run('попов алексей', { dateIso: PREVIOUS_BESTS_EVENT_DATE, timeMs: 1205000 }),
  run('троилин антон', { dateIso: '2025-03-02', timeMs: 1133000 }),
  run('троилин антон', { dateIso: '2025-02-02', timeMs: 1133000 }),
  run('троилин антон', { dateIso: '2025-03-09', timeMs: 1200000, distanceKm: TWO_THREE_KM_DISTANCE_KM }),
  run('новиков сергей', { dateIso: '2025-05-04', timeMs: 1400000 }),
];

export const EXPECTED_PREVIOUS_BESTS: Record<string, PreviousBest> = {
  'попов алексей': { slug: '2025-01-12', dateIso: '2025-01-12', timeMs: 1252000 },
  'троилин антон': { slug: '2025-02-02', dateIso: '2025-02-02', timeMs: 1133000 },
};

/** The first day of the event's own year — the «лучшее в этом году» bound of the same scan. */
export const PREVIOUS_BESTS_YEAR_START = '2025-01-01';

/** The 2024 run below the year bound; without it Попов's season best is his February 21:50. */
export const PREVIOUS_BESTS_LAST_YEAR_RUNS: ParticipantRun[] = [
  run('попов алексей', { dateIso: '2024-11-10', timeMs: 1100000 }),
  ...PREVIOUS_BESTS_RUNS,
];

/** Bounded to 2025, the 2024 record is out of reach and every athlete falls back to the season. */
export const EXPECTED_YEAR_PREVIOUS_BESTS: Record<string, PreviousBest> = EXPECTED_PREVIOUS_BESTS;
