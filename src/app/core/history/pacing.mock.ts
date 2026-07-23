import { AthleteRun } from '../models/athlete-history.interface';
import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { AthleteFirstLap } from './first-lap.interface';
import { SECOND_LAP_DISTANCE_KM } from './pacing.constant';
import { PacingProfile } from './pacing.enum';
import { AthletePacing, LapDeltaRow, PacingBoards, PacingRow, SplitLeadMeeting } from './pacing.interface';

/** The very computation of `pacingIndex`, so float expectations match to the last ulp. */
export function indexOf(lapMs: number, totalMs: number): number {
  return (totalMs - lapMs) / SECOND_LAP_DISTANCE_KM / (lapMs / TWO_THREE_KM_DISTANCE_KM);
}

/** Lap 11:30 of a 25:00 finish paces both laps at exactly 5:00/km — the index is exactly 1. */
export const EVEN_LAP_MS = 690_000;
export const EVEN_TOTAL_MS = 1_500_000;

/** Lap 11:40 of the same finish leaves a faster second lap — a negative split, index ≈ 0.97. */
export const NEGATIVE_LAP_MS = 700_000;

/** Lap 11:50 of the same finish sits below the even band — a habitual negative splitter's run. */
export const DEEP_NEGATIVE_LAP_MS = 710_000;

/** Lap 10:00 of the same finish reads as a fast start and a fade — index ≈ 1.28. */
export const FADE_LAP_MS = 600_000;

/** The real-protocol noise: Lap 1 = 14:59 next to Lap 2 = 8:52 — the index falls below 0.6. */
export const NOISE_LAP_MS = 899_000;
export const NOISE_TOTAL_MS = 1_431_000;

function toRun(slug: string, timeMs: number, distanceKm = FIVE_KM_DISTANCE_KM): AthleteRun {
  return { dateIso: slug, slug, timeMs, distanceKm };
}

function toLap(slug: string, lapMs: number): AthleteFirstLap {
  return { dateIso: slug, slug, lapMs };
}

/**
 * Three valid splits (negative, even, fade), plus every excluded flavour: a noisy split, a
 * one-lap run, a run without a recorded split, and a lap of an event outside the run history.
 * A second copy of the best index on a later date checks the earlier-run tie rule.
 */
export const PACING_RUNS: AthleteRun[] = [
  toRun('2025-01-12', EVEN_TOTAL_MS),
  toRun('2025-02-16', EVEN_TOTAL_MS),
  toRun('2025-01-05', EVEN_TOTAL_MS),
  toRun('2025-01-19', EVEN_TOTAL_MS),
  toRun('2025-01-26', NOISE_TOTAL_MS),
  toRun('2025-02-02', NEGATIVE_LAP_MS, TWO_THREE_KM_DISTANCE_KM),
  toRun('2025-02-09', EVEN_TOTAL_MS),
];

export const PACING_LAPS: AthleteFirstLap[] = [
  toLap('2025-01-05', NEGATIVE_LAP_MS),
  toLap('2025-01-12', EVEN_LAP_MS),
  toLap('2025-01-19', FADE_LAP_MS),
  toLap('2025-01-26', NOISE_LAP_MS),
  toLap('2025-02-02', NEGATIVE_LAP_MS),
  toLap('2025-02-16', NEGATIVE_LAP_MS),
  toLap('2025-03-01', EVEN_LAP_MS),
];

export const EXPECTED_ATHLETE_PACING: AthletePacing = {
  profile: PacingProfile.even,
  medianIndex: (indexOf(NEGATIVE_LAP_MS, EVEN_TOTAL_MS) + 1) / 2,
  validCount: 4,
  negativeSplitCount: 2,
  bestSplit: { slug: '2025-01-05', dateIso: '2025-01-05', index: indexOf(NEGATIVE_LAP_MS, EVEN_TOTAL_MS) },
};

export const NEGATIVE_PROFILE_RUNS: AthleteRun[] = [
  toRun('2025-04-06', EVEN_TOTAL_MS),
  toRun('2025-04-13', EVEN_TOTAL_MS),
  toRun('2025-04-20', EVEN_TOTAL_MS),
];

export const NEGATIVE_PROFILE_LAPS: AthleteFirstLap[] = [
  toLap('2025-04-06', DEEP_NEGATIVE_LAP_MS),
  toLap('2025-04-13', DEEP_NEGATIVE_LAP_MS),
  toLap('2025-04-20', DEEP_NEGATIVE_LAP_MS),
];

export const FADE_PROFILE_LAPS: AthleteFirstLap[] = [
  toLap('2025-04-06', FADE_LAP_MS),
  toLap('2025-04-13', FADE_LAP_MS),
  toLap('2025-04-20', FADE_LAP_MS),
];

/**
 * A published-protocol shape: four ranked finishers (one lap-time dead heat), a lap-and-total
 * dead heat pair, and every non-candidate flavour — DNF, one-lap, split-less and noisy rows.
 */
export const LAP_DELTA_ROWS: LapDeltaRow[] = [
  { time23: '11:00', totalMs: 1_400_000, distanceKm: FIVE_KM_DISTANCE_KM },
  { time23: '10:00', totalMs: 1_410_000, distanceKm: FIVE_KM_DISTANCE_KM },
  { time23: '11:30', totalMs: 1_500_000, distanceKm: FIVE_KM_DISTANCE_KM },
  { time23: '11:30', totalMs: 1_510_000, distanceKm: FIVE_KM_DISTANCE_KM },
  { time23: '11:30', totalMs: 1_510_000, distanceKm: FIVE_KM_DISTANCE_KM },
  { time23: '25:00', totalMs: 1_500_000, distanceKm: TWO_THREE_KM_DISTANCE_KM },
  { time23: '', totalMs: 1_490_000, distanceKm: FIVE_KM_DISTANCE_KM },
  { time23: '14:59', totalMs: NOISE_TOTAL_MS, distanceKm: FIVE_KM_DISTANCE_KM },
  { time23: '12:00', totalMs: null, distanceKm: null },
];

/** The fast starter loses one place on lap 2, the strong closer gains it back; dead heats stay 0. */
export const EXPECTED_LAP_DELTAS: (number | null)[] = [1, -1, 0, 0, 0, null, null, null, null];

function toPacingRow(key: string, gender: PacingRow['gender'], slug: string, lapMs: number, totalMs: number): PacingRow {
  return { key, displayName: key, gender, slug, lapMs, totalMs };
}

/** One athlete's same-lap run replicated over three single-runner events. */
function soloSeason(key: string, gender: PacingRow['gender'], slugs: string[], lapMs: number): PacingRow[] {
  return slugs.map((slug) => toPacingRow(key, gender, slug, lapMs, EVEN_TOTAL_MS));
}

const JANUARY_SLUGS = ['2025-01-05', '2025-01-12', '2025-01-19'];
const MAY_SLUGS = ['2025-05-04', '2025-05-11', '2025-05-18'];

/** One shared five-runner race: the two late chargers gain places, the fast starters bleed them. */
function chargersRace(slug: string): PacingRow[] {
  return [
    toPacingRow('petr', Gender.male, slug, 720_000, 1_450_000),
    toPacingRow('timur', Gender.male, slug, 725_000, 1_455_000),
    toPacingRow('oleg', Gender.male, slug, 650_000, 1_500_000),
    toPacingRow('dina', Gender.female, slug, 700_000, 1_550_000),
    toPacingRow('zoya', Gender.female, slug, 730_000, 1_540_000),
  ];
}

/**
 * The season boards' field. Evenness: boris beats anton on deviation, anna beats the identical
 * vera on the name; a two-run athlete, a genderless one and a noisy split never qualify. Second
 * half: petr and timur both net +6 over three shared races (the name decides), oleg and dina
 * stay negative, and the lone 2024 pair never reaches three scoped races.
 */
export const PACING_BOARD_ROWS: PacingRow[] = [
  toPacingRow('boris', Gender.male, '2025-01-05', EVEN_LAP_MS, EVEN_TOTAL_MS),
  toPacingRow('boris', Gender.male, '2025-01-12', NEGATIVE_LAP_MS, EVEN_TOTAL_MS),
  toPacingRow('boris', Gender.male, '2025-01-19', 680_000, EVEN_TOTAL_MS),
  toPacingRow('boris', Gender.male, '2025-01-26', NOISE_LAP_MS, NOISE_TOTAL_MS),
  ...soloSeason('anton', Gender.male, ['2025-02-02', '2025-02-09', '2025-02-16'], FADE_LAP_MS),
  ...soloSeason('anna', Gender.female, JANUARY_SLUGS, EVEN_LAP_MS),
  ...soloSeason('vera', Gender.female, JANUARY_SLUGS, EVEN_LAP_MS),
  ...soloSeason('semen', Gender.male, ['2025-03-02', '2025-03-09'], EVEN_LAP_MS),
  ...soloSeason('nikita', null, JANUARY_SLUGS, EVEN_LAP_MS),
  ...MAY_SLUGS.flatMap(chargersRace),
  toPacingRow('petr', Gender.male, '2024-06-02', 720_000, 1_450_000),
  toPacingRow('oleg', Gender.male, '2024-06-02', 650_000, 1_500_000),
];

export const EXPECTED_2025_BOARDS: PacingBoards = {
  evenest: {
    [Gender.male]: { key: 'boris', displayName: 'boris', deviation: Math.abs(indexOf(NEGATIVE_LAP_MS, EVEN_TOTAL_MS) - 1), count: 3 },
    [Gender.female]: { key: 'anna', displayName: 'anna', deviation: 0, count: 3 },
  },
  secondHalf: {
    [Gender.male]: { key: 'petr', displayName: 'petr', gainedPlaces: 6, count: 3 },
    [Gender.female]: { key: 'zoya', displayName: 'zoya', gainedPlaces: 3, count: 3 },
  },
};

/** All time widens petr to a fourth race — the 2024 pair adds one more gained place. */
export const EXPECTED_ALL_TIME_SECOND_HALF: PacingBoards['secondHalf'] = {
  [Gender.male]: { key: 'petr', displayName: 'petr', gainedPlaces: 7, count: 4 },
  [Gender.female]: { key: 'zoya', displayName: 'zoya', gainedPlaces: 3, count: 3 },
};

export const EMPTY_BOARDS: PacingBoards = {
  evenest: { [Gender.male]: null, [Gender.female]: null },
  secondHalf: { [Gender.male]: null, [Gender.female]: null },
};

export const SPLIT_LEAD_MEETINGS: SplitLeadMeeting[] = [
  { slug: '2025-01-05', leftMs: EVEN_TOTAL_MS, rightMs: EVEN_TOTAL_MS },
  { slug: '2025-01-12', leftMs: EVEN_TOTAL_MS, rightMs: EVEN_TOTAL_MS },
  { slug: '2025-01-19', leftMs: EVEN_TOTAL_MS, rightMs: EVEN_TOTAL_MS },
  { slug: '2025-01-26', leftMs: NOISE_TOTAL_MS, rightMs: EVEN_TOTAL_MS },
  { slug: '2025-02-02', leftMs: EVEN_TOTAL_MS, rightMs: NOISE_TOTAL_MS },
];

export const LEFT_MEETING_LAPS: AthleteFirstLap[] = [
  toLap('2025-01-05', NEGATIVE_LAP_MS),
  toLap('2025-01-19', EVEN_LAP_MS),
  toLap('2025-01-26', NOISE_LAP_MS),
  toLap('2025-02-02', EVEN_LAP_MS),
];

export const RIGHT_MEETING_LAPS: AthleteFirstLap[] = [
  toLap('2025-01-05', EVEN_LAP_MS),
  toLap('2025-01-12', EVEN_LAP_MS),
  toLap('2025-01-26', EVEN_LAP_MS),
  toLap('2025-02-02', NOISE_LAP_MS),
];

export const EXPECTED_SPLIT_LEADS = [{ leftLapMs: NEGATIVE_LAP_MS, rightLapMs: EVEN_LAP_MS }, null, null, null, null];
