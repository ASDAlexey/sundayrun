import { and, asc, eq, ne } from 'drizzle-orm';

import { normalizeAthleteKey } from '../core/history/athlete-key';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { PacingRow } from '../core/history/pacing.interface';
import { athletes, results } from '../core/sqlite/protocol-db.schema';
import { ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { parseDuration } from '../core/time/duration';
import { asGender } from './protocol-db-row';

/**
 * Every 5 km finish with a recorded first-lap split across the whole archive — the scan behind
 * the pacing nominations on the records page (the year filter cuts client-side; the whole set is
 * a few thousand short rows read once). Splits live as text on the protocol rows, so the read
 * parses on the fly and drops the unparsable; the slug doubles as the ISO event date. Lives apart
 * from `protocol-db-queries` only to keep that file inside its size budget.
 */
export async function selectPacingRows(db: ProtocolDrizzle): Promise<PacingRow[]> {
  const [rows, athleteRows] = await Promise.all([
    db
      .select({ fullName: results.fullName, time23: results.time23, gender: results.gender, slug: results.slug, totalMs: results.totalMs })
      .from(results)
      // The total-less and unparsable-split rows fall out below, where TypeScript sees the narrowing.
      .where(and(ne(results.time23, ''), eq(results.distanceKm, FIVE_KM_DISTANCE_KM)))
      .orderBy(asc(results.slug), asc(results.idx)),
    db.select({ key: athletes.key, displayName: athletes.displayName }).from(athletes),
  ]);
  const displayNames = new Map(athleteRows.map((row) => [row.key, row.displayName]));

  return rows.flatMap((row) => {
    const lapMs = parseDuration(row.time23);

    if (lapMs === null || row.totalMs === null) {
      return [];
    }

    const key = normalizeAthleteKey(row.fullName);

    return [
      {
        key,
        displayName: displayNames.get(key) ?? row.fullName,
        gender: asGender(row.gender),
        slug: row.slug,
        lapMs,
        totalMs: row.totalMs,
      },
    ];
  });
}
