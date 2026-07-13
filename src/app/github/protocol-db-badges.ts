import { and, count, countDistinct, eq, isNotNull, min, sql } from 'drizzle-orm';

import { yearBadgeRarity } from '../core/history/badge-rarity';
import { YearBadgeRarity } from '../core/history/badge-rarity.type';
import { athleteSignalsOf, badgeSignalsByAthlete } from '../core/history/badge-signals';
import { currentCourseRecordEntries } from '../core/history/course-records';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { YearBadge } from '../core/history/year-badges.enum';
import { yearRankBadgeHolders } from '../core/history/year-ranks';
import { YearBestRow } from '../core/history/year-ranks.interface';
import { athletes, participations, runs } from '../core/sqlite/protocol-db.schema';
import { ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { selectCourseRecords, selectFirstEventDateByYear, selectHistoryRunRows } from './protocol-db-queries';
import { asGender, asNumber, asString } from './protocol-db-row';

/**
 * The badge reads of the athlete page, apart from `protocol-db-queries` only to keep that file
 * inside its size budget.
 */

/**
 * Every athlete-year's best 5 km time with the athlete's gender — the year-ranking badge source.
 * Genderless athletes never rank (the year tables are gendered), so the SQL filter drops them.
 */
export async function selectYearBestRows(db: ProtocolDrizzle): Promise<YearBestRow[]> {
  const rows = await db
    .select({
      athleteKey: runs.athleteKey,
      gender: athletes.gender,
      year: sql<string>`substr(${runs.dateIso}, 1, 4)`,
      bestMs: min(runs.timeMs),
    })
    .from(runs)
    .innerJoin(athletes, eq(athletes.key, runs.athleteKey))
    .where(and(eq(runs.distanceKm, FIVE_KM_DISTANCE_KM), isNotNull(athletes.gender)))
    .groupBy(runs.athleteKey, sql`substr(${runs.dateIso}, 1, 4)`);

  // The SQL filter already dropped genderless athletes; `flatMap` only narrows the type.
  return rows.flatMap((row) => {
    const gender = asGender(row.gender);

    return gender === null ? [] : [{ athleteKey: row.athleteKey, gender, year: asString(row.year), bestMs: asNumber(row.bestMs) }];
  });
}

/**
 * Badge → the share of participants who ever earned it — the «есть у 12% участников» hint on badge
 * chips. Activity aggregates per athlete-year feed the same `yearBadgesOf` rule the chips are
 * awarded by; an athlete's earliest run of a year equals the year's first race date iff they
 * finished that race, so no per-run scan is needed. The ranking badges join in from the year-best
 * table and the course record progression (only the standing holders own the course crown); the
 * comeback and slow-finish signals scan the full run history — their criteria cross the years.
 */
export async function selectYearBadgeRarity(db: ProtocolDrizzle): Promise<YearBadgeRarity> {
  const [activityRows, participantRows, firstEventDateByYear, yearBestRows, courseRecords, historyRows] = await Promise.all([
    db
      .select({
        athleteKey: runs.athleteKey,
        year: sql<string>`substr(${runs.dateIso}, 1, 4)`,
        runCount: count(),
        monthCount: countDistinct(sql`substr(${runs.dateIso}, 6, 2)`),
        firstRunDateIso: min(runs.dateIso),
      })
      .from(runs)
      .groupBy(runs.athleteKey, sql`substr(${runs.dateIso}, 1, 4)`),
    db.select({ participantCount: countDistinct(participations.athleteKey) }).from(participations),
    selectFirstEventDateByYear(db),
    selectYearBestRows(db),
    selectCourseRecords(db),
    selectHistoryRunRows(db),
  ]);
  const [{ participantCount }] = participantRows;
  const signalsByAthlete = badgeSignalsByAthlete(historyRows);
  const activities = activityRows.map((row) => {
    const year = asString(row.year);
    const signals = athleteSignalsOf(signalsByAthlete, row.athleteKey);

    return {
      athleteKey: row.athleteKey,
      year,
      runCount: row.runCount,
      monthCount: row.monthCount,
      firstRunDateIso: asString(row.firstRunDateIso),
      hasComeback: signals.comebackYears.has(year),
      slowFinishCount: signals.slowFinishCountByYear[year] ?? 0,
    };
  });
  const extraHolders = yearRankBadgeHolders(yearBestRows);
  const courseKings = currentCourseRecordEntries(courseRecords);

  if (courseKings.length > 0) {
    extraHolders.set(YearBadge.courseKing, new Set(courseKings.map((entry) => entry.key)));
  }

  return yearBadgeRarity(activities, firstEventDateByYear, participantCount, extraHolders);
}
