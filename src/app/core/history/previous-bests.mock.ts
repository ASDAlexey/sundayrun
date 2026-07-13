import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { ParticipantRun } from './notables.interface';
import { PreviousBest } from './previous-bests.interface';

export const PREVIOUS_BESTS_EVENT_DATE = '2025-04-27';

const run = (athleteKey: string, dateIso: string, timeMs: number, distanceKm: number = FIVE_KM_DISTANCE_KM): ParticipantRun => ({
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
  run('попов алексей', '2025-01-12', 1252000),
  run('попов алексей', '2025-02-09', 1310000),
  run('попов алексей', PREVIOUS_BESTS_EVENT_DATE, 1205000),
  run('троилин антон', '2025-03-02', 1133000),
  run('троилин антон', '2025-02-02', 1133000),
  run('троилин антон', '2025-03-09', 1200000, TWO_THREE_KM_DISTANCE_KM),
  run('новиков сергей', '2025-05-04', 1400000),
];

export const EXPECTED_PREVIOUS_BESTS: Record<string, PreviousBest> = {
  'попов алексей': { slug: '2025-01-12', dateIso: '2025-01-12', timeMs: 1252000 },
  'троилин антон': { slug: '2025-02-02', dateIso: '2025-02-02', timeMs: 1133000 },
};
