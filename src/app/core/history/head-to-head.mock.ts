import { type AthleteRun } from '../models/athlete-history.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { type HeadToHead } from './head-to-head.interface';

/**
 * Two run histories covering every duel branch: a left win, a right win, a draw, races only one
 * side ran, and a shared slug where the left athlete ran the short course (never a meeting).
 */

const run = (dateIso: string, { timeMs, distanceKm = FIVE_KM_DISTANCE_KM }: { timeMs: number; distanceKm?: number }): AthleteRun => ({
  dateIso,
  slug: dateIso,
  timeMs,
  distanceKm,
});

export const LEFT_DUEL_RUNS: AthleteRun[] = [
  run('2024-01-07', { timeMs: 1500000 }),
  run('2024-02-04', { timeMs: 1600000 }),
  run('2024-03-03', { timeMs: 1550000 }),
  run('2024-04-07', { timeMs: 1400000 }),
  run('2024-05-05', { timeMs: 999000, distanceKm: 2.3 }),
];

export const RIGHT_DUEL_RUNS: AthleteRun[] = [
  run('2024-01-07', { timeMs: 1520000 }),
  run('2024-02-04', { timeMs: 1580000 }),
  run('2024-03-03', { timeMs: 1550000 }),
  run('2024-05-05', { timeMs: 1490000 }),
  run('2024-06-02', { timeMs: 1470000 }),
];

export const EXPECTED_HEAD_TO_HEAD: HeadToHead = {
  meetingCount: 3,
  leftWins: 1,
  rightWins: 1,
  draws: 1,
  meetings: [
    { slug: '2024-03-03', dateIso: '2024-03-03', leftMs: 1550000, rightMs: 1550000 },
    { slug: '2024-02-04', dateIso: '2024-02-04', leftMs: 1600000, rightMs: 1580000 },
    { slug: '2024-01-07', dateIso: '2024-01-07', leftMs: 1500000, rightMs: 1520000 },
  ],
};

/** The same duel with the sides swapped: the score mirrors, the meetings keep their order. */
export const EXPECTED_SWAPPED_HEAD_TO_HEAD: HeadToHead = {
  meetingCount: 3,
  leftWins: 1,
  rightWins: 1,
  draws: 1,
  meetings: [
    { slug: '2024-03-03', dateIso: '2024-03-03', leftMs: 1550000, rightMs: 1550000 },
    { slug: '2024-02-04', dateIso: '2024-02-04', leftMs: 1580000, rightMs: 1600000 },
    { slug: '2024-01-07', dateIso: '2024-01-07', leftMs: 1520000, rightMs: 1500000 },
  ],
};

export const EMPTY_HEAD_TO_HEAD: HeadToHead = {
  meetingCount: 0,
  leftWins: 0,
  rightWins: 0,
  draws: 0,
  meetings: [],
};
