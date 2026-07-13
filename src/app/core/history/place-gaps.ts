import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { PlaceGapRow } from './place-gaps.interface';

/**
 * Smashrun-style rank breakdown for the protocol: row index → how far the finisher is from the
 * next place up in their own gender group, in milliseconds. The gender winners, one-lap runners,
 * DNF rows and dead heats (a zero gap says nothing) stay null.
 */
export function placeGapsMs(rows: readonly PlaceGapRow[]): (number | null)[] {
  const timesByPlace = { [Gender.male]: new Map<number, number>(), [Gender.female]: new Map<number, number>() };

  for (const row of rows) {
    const place = genderPlaceOf(row);

    if (row.gender !== null && place !== null && row.totalMs !== null && row.distanceKm === FIVE_KM_DISTANCE_KM) {
      timesByPlace[row.gender].set(place, row.totalMs);
    }
  }

  return rows.map((row) => {
    const place = genderPlaceOf(row);

    if (row.gender === null || place === null || row.totalMs === null || row.distanceKm !== FIVE_KM_DISTANCE_KM) {
      return null;
    }

    const aheadMs = timesByPlace[row.gender].get(place - 1);

    if (aheadMs === undefined) {
      return null;
    }

    const gapMs = row.totalMs - aheadMs;

    return gapMs > 0 ? gapMs : null;
  });
}

/** The place inside the row's own gender group; null for genderless or place-less rows. */
function genderPlaceOf(row: PlaceGapRow): number | null {
  if (row.gender === null) {
    return null;
  }

  return row.gender === Gender.male ? row.placeM : row.placeF;
}
