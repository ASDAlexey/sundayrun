import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { type LeaderGapRow } from './leader-gaps.interface';

/**
 * One protocol covering every silent row: the gender winners, a dead heat for the runner-up spot,
 * a one-lap runner, a DNF, a genderless finisher and a woman far off the winner's pace.
 */
export const LEADER_GAP_ROWS: LeaderGapRow[] = [
  { gender: Gender.male, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_200_000 },
  { gender: Gender.male, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_212_000 },
  { gender: Gender.male, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_212_000 },
  { gender: Gender.female, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_500_000 },
  { gender: Gender.female, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_530_000 },
  { gender: Gender.female, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_650_000 },
  { gender: Gender.male, distanceKm: TWO_THREE_KM_DISTANCE_KM, totalMs: 660_000 },
  { gender: Gender.male, distanceKm: null, totalMs: null },
  { gender: null, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_400_000 },
];

/** Both men of the dead heat sit 12 s behind their winner, the second woman 30 s, the fourth 2:30. */
export const EXPECTED_LEADER_GAPS: (number | null)[] = [null, 12_000, 12_000, null, 30_000, 150_000, null, null, null];
