import { AthleteRecord } from '../models/athlete-history.interface';
import { Gender } from '../models/gender.enum';
import { BestResult } from './best-results.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';

export const LEADERBOARD_LIMIT = 2;

/**
 * Covers: gender filtering, a DNF-only athlete skipped (null best), a tie broken by name in
 * Russian collation, the earliest run of a repeated best chosen, a 2.3 km run with the same
 * time ignored, and the limit cutting the slowest man.
 */
export const LEADERBOARD_RECORDS: AthleteRecord[] = [
  {
    key: 'быстров борис',
    displayName: 'Быстров Борис',
    gender: Gender.male,
    participationSlugs: ['2025-03-02', '2025-03-09', '2025-03-16'],
    runs: [
      { dateIso: '2025-03-02', slug: '2025-03-02', timeMs: 1200000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2025-03-09', slug: '2025-03-09', timeMs: 1140000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2025-03-16', slug: '2025-03-16', timeMs: 1140000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1140000,
    bestMsByYear: { '2025': 1140000 },
  },
  {
    key: 'азбукин андрей',
    displayName: 'Азбукин Андрей',
    gender: Gender.male,
    participationSlugs: ['2025-04-06'],
    runs: [
      // A one-lap run with the same duration as the best must not become the record run.
      { dateIso: '2025-03-30', slug: '2025-03-30', timeMs: 1140000, distanceKm: TWO_THREE_KM_DISTANCE_KM },
      { dateIso: '2025-04-06', slug: '2025-04-06', timeMs: 1140000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1140000,
    bestMsByYear: { '2025': 1140000 },
  },
  {
    key: 'тихонов трофим',
    displayName: 'Тихонов Трофим',
    gender: Gender.male,
    participationSlugs: ['2025-05-04'],
    runs: [{ dateIso: '2025-05-04', slug: '2025-05-04', timeMs: 1800000, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: 1800000,
    bestMsByYear: { '2025': 1800000 },
  },
  {
    key: 'сошедшая софья',
    displayName: 'Сошедшая Софья',
    gender: Gender.female,
    participationSlugs: ['2025-05-04'],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
  {
    key: 'ланская лидия',
    displayName: 'Ланская Лидия',
    gender: Gender.female,
    participationSlugs: ['2025-05-11'],
    runs: [{ dateIso: '2025-05-11', slug: '2025-05-11', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1500000 },
  },
];

/** Ties at 19:00 break by name (Азбукин before Быстров); the earliest 5 km best run wins. */
export const EXPECTED_MALE_LEADERBOARD: BestResult[] = [
  { key: 'азбукин андрей', displayName: 'Азбукин Андрей', bestMs: 1140000, dateIso: '2025-04-06', slug: '2025-04-06' },
  { key: 'быстров борис', displayName: 'Быстров Борис', bestMs: 1140000, dateIso: '2025-03-09', slug: '2025-03-09' },
];

export const EXPECTED_FEMALE_LEADERBOARD: BestResult[] = [
  { key: 'ланская лидия', displayName: 'Ланская Лидия', bestMs: 1500000, dateIso: '2025-05-11', slug: '2025-05-11' },
];
