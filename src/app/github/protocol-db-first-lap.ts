import { and, eq, ne } from 'drizzle-orm';

import { normalizeAthleteKey } from '../core/history/athlete-key';
import { bestFirstLap } from '../core/history/first-lap';
import { AthleteFirstLap } from '../core/history/first-lap.interface';
import { parseDuration } from '../core/time/duration';
import { results, runs } from '../core/sqlite/protocol-db.schema';
import { ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';

/**
 * The athlete's first-lap reads, apart from `protocol-db-queries` only to keep that file inside
 * its size budget.
 */

/**
 * Every recorded first-lap (2.3 km) split over the athlete's 5 km finishes. The rows arrive like
 * in `selectAthleteRunPlaces`: joined by the athlete's runs and matched back by the normalized
 * name against the organisers' spelling.
 */
export async function selectAthleteFirstLaps(db: ProtocolDrizzle, key: string): Promise<AthleteFirstLap[]> {
  const rows = await db
    .select({ slug: results.slug, fullName: results.fullName, time23: results.time23, dateIso: runs.dateIso })
    .from(results)
    .innerJoin(runs, and(eq(runs.slug, results.slug), eq(runs.athleteKey, key)))
    .where(and(ne(results.time23, ''), ne(results.time5, '')));

  return rows.flatMap((row) => {
    const lapMs = parseDuration(row.time23);

    return lapMs === null || normalizeAthleteKey(row.fullName) !== key ? [] : [{ dateIso: row.dateIso, slug: row.slug, lapMs }];
  });
}

/** The athlete's fastest first-lap split, or null when no run of theirs carries a recorded one. */
export async function selectAthleteBestFirstLap(db: ProtocolDrizzle, key: string): Promise<AthleteFirstLap | null> {
  return bestFirstLap(await selectAthleteFirstLaps(db, key));
}
