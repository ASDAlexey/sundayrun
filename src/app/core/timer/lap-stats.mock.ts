import { Gender, GenderType } from '../models/gender.enum';
import { LapStats, LapStatsSample } from './lap-stats.interface';
import {
  POPOV_ALEKSEY_ATHLETE_KEY,
  ROMANENKO_ATHLETE_KEY,
  ROMANENKO_LAP_MS,
  TROILIN_ATHLETE_KEY,
  TROILIN_LAP_MS,
} from './timer-session.mock';

/** The two other laps of the same man: one slower than his best, one slower still. */
export const TROILIN_MEDIAN_LAP_MS = 590_000;
export const TROILIN_SLOWEST_LAP_MS = 620_000;

/** An athlete the archive has no gender for, and the fastest lap of the whole sample. */
export const UNGENDERED_LAP_MS = 500_000;

/**
 * Three laps of one man (his best in the middle, so both the improving and the idle branch run),
 * one of a woman, and one of a genderless athlete who is faster than either course record.
 */
export const LAP_STATS_SAMPLES: LapStatsSample[] = [
  { key: TROILIN_ATHLETE_KEY, gender: Gender.male, lapMs: TROILIN_MEDIAN_LAP_MS },
  { key: TROILIN_ATHLETE_KEY, gender: Gender.male, lapMs: TROILIN_LAP_MS },
  { key: ROMANENKO_ATHLETE_KEY, gender: Gender.female, lapMs: ROMANENKO_LAP_MS },
  { key: TROILIN_ATHLETE_KEY, gender: Gender.male, lapMs: TROILIN_SLOWEST_LAP_MS },
  { key: POPOV_ALEKSEY_ATHLETE_KEY, gender: null, lapMs: UNGENDERED_LAP_MS },
];

export const LAP_STATS_EXPECTED_ENTRIES: [string, number][] = [
  [TROILIN_ATHLETE_KEY, TROILIN_MEDIAN_LAP_MS],
  [ROMANENKO_ATHLETE_KEY, ROMANENKO_LAP_MS],
  [POPOV_ALEKSEY_ATHLETE_KEY, UNGENDERED_LAP_MS],
];

export const LAP_STATS_BEST_ENTRIES: [string, number][] = [
  [TROILIN_ATHLETE_KEY, TROILIN_LAP_MS],
  [ROMANENKO_ATHLETE_KEY, ROMANENKO_LAP_MS],
  [POPOV_ALEKSEY_ATHLETE_KEY, UNGENDERED_LAP_MS],
];

export const LAP_STATS_APPEARANCE_ENTRIES: [string, number][] = [
  [TROILIN_ATHLETE_KEY, 3],
  [ROMANENKO_ATHLETE_KEY, 1],
  [POPOV_ALEKSEY_ATHLETE_KEY, 1],
];

/** The genderless athlete is the fastest of the sample and still holds neither record. */
export const LAP_STATS_COURSE_RECORD: Readonly<Record<GenderType, number | null>> = {
  [Gender.male]: TROILIN_LAP_MS,
  [Gender.female]: ROMANENKO_LAP_MS,
};

/** What an archive with no timed first lap at all boils down to. */
export const EMPTY_LAP_STATS: LapStats = {
  expectedLapMs: new Map(),
  bestLapMs: new Map(),
  appearanceCount: new Map(),
  courseRecordLapMs: { [Gender.male]: null, [Gender.female]: null },
};
