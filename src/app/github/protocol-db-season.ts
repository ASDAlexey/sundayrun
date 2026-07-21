import { and, asc, eq, isNotNull, like, ne } from 'drizzle-orm';

import { normalizeAthleteKey } from '../core/history/athlete-key';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { SeasonRun } from '../core/history/season-positions.interface';
import { athletes, results, runs } from '../core/sqlite/protocol-db.schema';
import { ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { parseDuration } from '../core/time/duration';
import { asGender } from './protocol-db-row';

/**
 * Every 5 km finish of one season with the finisher's identity, oldest first — the standings-race
 * scan behind the records-page bump chart. One read serves both gender charts: the split happens
 * in `buildSeasonPositions`, and a season is a few hundred short rows. Lives apart from
 * `protocol-db-queries` only to keep that file inside its size budget.
 */
export async function selectSeasonRuns(db: ProtocolDrizzle, year: string): Promise<SeasonRun[]> {
  const rows = await db
    .select({
      key: runs.athleteKey,
      displayName: athletes.displayName,
      gender: athletes.gender,
      dateIso: runs.dateIso,
      timeMs: runs.timeMs,
    })
    .from(runs)
    .innerJoin(athletes, eq(athletes.key, runs.athleteKey))
    .where(and(eq(runs.distanceKm, FIVE_KM_DISTANCE_KM), like(runs.dateIso, `${year}-%`)))
    .orderBy(asc(runs.dateIso), asc(runs.athleteKey));

  return rows.map((row) => ({ ...row, gender: asGender(row.gender) }));
}

/**
 * The recorded first-lap (2.3 km) splits of one season, with or without a 5 km finish, same shape
 * as `selectSeasonRuns` with the split as `timeMs` — the «Первый круг» mode of the bump chart
 * ranks them with the very same standings scan. Splits live as text on the protocol rows (not in
 * `runs`), so the read goes through `results`, parses on the fly and drops rows without a
 * recorded split; the slug doubles as the ISO event date, saving the events join.
 */
export async function selectSeasonLapRuns(db: ProtocolDrizzle, year: string): Promise<SeasonRun[]> {
  const [rows, athleteRows] = await Promise.all([
    db
      .select({ fullName: results.fullName, time23: results.time23, gender: results.gender, slug: results.slug })
      .from(results)
      .where(and(ne(results.time23, ''), isNotNull(results.gender), like(results.slug, `${year}-%`)))
      .orderBy(asc(results.slug), asc(results.fullName)),
    db.select({ key: athletes.key, displayName: athletes.displayName }).from(athletes),
  ]);
  const displayNames = new Map(athleteRows.map((row) => [row.key, row.displayName]));

  return rows.flatMap((row) => {
    const gender = asGender(row.gender);
    const timeMs = parseDuration(row.time23);

    if (gender === null || timeMs === null) {
      return [];
    }

    const key = normalizeAthleteKey(row.fullName);

    return [{ key, displayName: displayNames.get(key) ?? row.fullName, gender, dateIso: row.slug, timeMs }];
  });
}
