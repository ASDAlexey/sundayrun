import { Gender } from '../models/gender.enum';
import { YearBadge, YearBadgeType } from './year-badges.enum';
import { YearBestRow, YearRankedBadge } from './year-ranks.interface';

const MALE_BASE_MS = 1000000;
const MALE_STEP_MS = 10000;
const MALE_TABLE_SIZE = 31;

const maleRow = (index: number): YearBestRow => ({
  athleteKey: `m${index}`,
  gender: Gender.male,
  year: '2025',
  bestMs: MALE_BASE_MS + index * MALE_STEP_MS,
});

/**
 * A 31-strong men's table of 2025 (the 31st rank earns nothing), the same `m0` alone in 2024
 * (a one-man table still crowns its king), and a women's 2025 table with a tie at the top —
 * both women share rank 1, pushing the third one to rank 3.
 */
export const SOLO_YEAR_BEST_ROWS: YearBestRow[] = [{ athleteKey: 'm0', gender: Gender.male, year: '2024', bestMs: 1100000 }];

export const YEAR_BEST_ROWS: YearBestRow[] = [
  ...Array.from({ length: MALE_TABLE_SIZE }, (_, index) => maleRow(index)),
  ...SOLO_YEAR_BEST_ROWS,
  { athleteKey: 'вера', gender: Gender.female, year: '2025', bestMs: 1200000 },
  { athleteKey: 'ванда', gender: Gender.female, year: '2025', bestMs: 1200000 },
  { athleteKey: 'вильма', gender: Gender.female, year: '2025', bestMs: 1300000 },
];

/** The men's ladder cuts plus both tied queens; `m30` (rank 31) never appears. */
export const EXPECTED_YEAR_RANK_HOLDERS = new Map<YearBadgeType, Set<string>>([
  [YearBadge.yearKing, new Set(['m0', 'вера', 'ванда'])],
  [YearBadge.yearPodium, new Set(['m1', 'm2', 'вильма'])],
  [YearBadge.yearTopTen, new Set(Array.from({ length: 7 }, (_, index) => `m${index + 3}`))],
  [YearBadge.yearTopThirty, new Set(Array.from({ length: 20 }, (_, index) => `m${index + 10}`))],
]);

/** `m0` tops both of his years. */
export const EXPECTED_M0_RANK_BADGES: Record<string, YearBadgeType> = { '2025': YearBadge.yearKing, '2024': YearBadge.yearKing };

/** The tied queen earns the crown, not the podium. */
export const EXPECTED_TIED_QUEEN_BADGES: Record<string, YearBadgeType> = { '2025': YearBadge.yearKing };

/** One entry per athlete-year that ranks; used to pin the raw `yearRankedBadges` shape. */
export const EXPECTED_SOLO_RANKED_BADGES: YearRankedBadge[] = [{ athleteKey: 'm0', year: '2024', badge: YearBadge.yearKing }];

/** [rank, expected badge] over every ladder boundary. */
export const YEAR_RANK_BADGE_CASES: readonly (readonly [number, YearBadgeType | null])[] = [
  [1, YearBadge.yearKing],
  [2, YearBadge.yearPodium],
  [3, YearBadge.yearPodium],
  [4, YearBadge.yearTopTen],
  [10, YearBadge.yearTopTen],
  [11, YearBadge.yearTopThirty],
  [30, YearBadge.yearTopThirty],
  [31, null],
];
