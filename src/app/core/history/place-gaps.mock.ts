import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { PlaceGapRow } from './place-gaps.interface';

/**
 * One protocol covering every silent row: the gender winners, a dead heat, a one-lap runner,
 * a DNF, a genderless finisher and a place with the row above it missing from the protocol.
 */
export const PLACE_GAP_ROWS: PlaceGapRow[] = [
  { gender: Gender.male, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_200_000, placeM: 1, placeF: null },
  { gender: Gender.male, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_212_000, placeM: 2, placeF: null },
  { gender: Gender.male, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_212_000, placeM: 3, placeF: null },
  { gender: Gender.female, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_500_000, placeM: null, placeF: 1 },
  { gender: Gender.female, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_530_000, placeM: null, placeF: 2 },
  { gender: Gender.female, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_650_000, placeM: null, placeF: 4 },
  { gender: Gender.male, distanceKm: TWO_THREE_KM_DISTANCE_KM, totalMs: 660_000, placeM: null, placeF: null },
  { gender: Gender.male, distanceKm: null, totalMs: null, placeM: null, placeF: null },
  { gender: null, distanceKm: FIVE_KM_DISTANCE_KM, totalMs: 1_400_000, placeM: null, placeF: null },
];

/** Only the male runner-up (12 s) and the second woman (30 s) learn their gap. */
export const EXPECTED_PLACE_GAPS: (number | null)[] = [null, 12_000, null, null, 30_000, null, null, null, null];
