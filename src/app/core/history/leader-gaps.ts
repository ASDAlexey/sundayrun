import { Gender, type GenderType } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { type LeaderGapRow } from './leader-gaps.interface';

/**
 * The protocol's «отставание от лидера» column: row index → how far the finisher sits behind the
 * winner of their own gender group, in milliseconds. The winners, one-lap runners, DNF rows and
 * finishers without a gender stay null — the winner is nobody's chaser.
 */
export function leaderGapsMs(rows: readonly LeaderGapRow[]): (number | null)[] {
  const winnerMs = winnerMsOf(rows);

  return rows.map((row) => {
    const leaderMs = row.gender === null ? null : winnerMs[row.gender];

    if (leaderMs === null || row.totalMs === null || row.distanceKm !== FIVE_KM_DISTANCE_KM) {
      return null;
    }

    const gapMs = row.totalMs - leaderMs;

    return gapMs > 0 ? gapMs : null;
  });
}

/** The winning 5 km time of each gender group. A one-lap time is never the winner of anything. */
function winnerMsOf(rows: readonly LeaderGapRow[]): Record<GenderType, number | null> {
  const winnerMs: Record<GenderType, number | null> = { [Gender.male]: null, [Gender.female]: null };

  for (const row of rows) {
    if (row.gender === null || row.totalMs === null || row.distanceKm !== FIVE_KM_DISTANCE_KM) {
      continue;
    }

    const current = winnerMs[row.gender];

    if (current === null || row.totalMs < current) {
      winnerMs[row.gender] = row.totalMs;
    }
  }

  return winnerMs;
}
