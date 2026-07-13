import { and, asc, avg, count, countDistinct, desc, eq, isNotNull, like, lt, min, ne, sql } from 'drizzle-orm';

import { ArchiveIndexEntry } from '../core/github/archive-index.interface';
import { eventFilePaths } from '../core/github/event-paths';
import { buildEventResultsFile } from '../core/github/results-file';
import { EventResultsFile } from '../core/github/results-file.interface';
import { normalizeAthleteKey } from '../core/history/athlete-key';
import { courseRecordHistory } from '../core/history/course-records';
import { CourseRecordHistory } from '../core/history/course-records.type';
import { bestFirstLap, firstLapRecords } from '../core/history/first-lap';
import { AthleteFirstLap } from '../core/history/first-lap.interface';
import { FirstLapRecords } from '../core/history/first-lap.type';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { isoYear } from '../core/history/iso-year';
import { LegendFinish } from '../core/history/legend.interface';
import { ParticipantRun } from '../core/history/notables.interface';
import { buildPreviousBests } from '../core/history/previous-bests';
import { PreviousBest } from '../core/history/previous-bests.interface';
import { RivalRun } from '../core/history/rivals.interface';
import { PERSONAL_RECORD_NOTE_PREFIX } from '../core/history/notes-builder.constant';
import { OverallStats } from '../core/history/overall-stats.interface';
import { buildYearReview } from '../core/history/year-review';
import { YearReview } from '../core/history/year-review.interface';
import { AthleteRecord, AthleteRun } from '../core/models/athlete-history.interface';
import { parseDuration } from '../core/time/duration';
import { Gender, GenderType } from '../core/models/gender.enum';
import { ProtocolRow } from '../core/models/protocol-row.interface';
import { athletes, events, participations, results, runs } from '../core/sqlite/protocol-db.schema';
import { ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { asGender, asNumber, asString } from './protocol-db-row';

/**
 * The typed reads the public pages run against `sundayrun.db`, expressed through the drizzle
 * query-builder — each mirrors what the page used to derive from a whole JSON file but touches only
 * the db pages its keys live on. Every function returns the exact shape the page logic consumes;
 * aggregate-derived nullable columns and gender are coerced with the `protocol-db-row` readers.
 */

/** The athlete page payload: the full record of one athlete, or null when the key is unknown. */
export async function selectAthleteRecord(db: ProtocolDrizzle, key: string): Promise<AthleteRecord | null> {
  const [athlete] = await db.select().from(athletes).where(eq(athletes.key, key));

  if (!athlete) {
    return null;
  }

  const [runRows, participationRows] = await Promise.all([
    db
      .select({ dateIso: runs.dateIso, slug: runs.slug, timeMs: runs.timeMs, distanceKm: runs.distanceKm })
      .from(runs)
      .where(eq(runs.athleteKey, key))
      .orderBy(asc(runs.dateIso)),
    db
      .select({ slug: participations.slug })
      .from(participations)
      .where(eq(participations.athleteKey, key))
      .orderBy(asc(participations.slug)),
  ]);

  return {
    key,
    displayName: athlete.displayName,
    gender: asGender(athlete.gender),
    participationSlugs: participationRows.map((row) => row.slug),
    runs: runRows,
    bestMs: athlete.bestMs,
    bestMsByYear: bestMsByYear(runRows),
  };
}

/**
 * The gender places of one athlete's runs, slug → place — the «Место» column of the athlete page.
 * A protocol row carries the place only in its own gender column, so the coalesce picks whichever
 * side is filled. The rows are fetched by joining the athlete's runs (only finishers hold places)
 * and matched back by the normalized name, because protocols keep the organisers' spelling while
 * the history keys athletes by the normalized form. Rows without a place are simply absent.
 */
export async function selectAthleteRunPlaces(db: ProtocolDrizzle, key: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ slug: results.slug, fullName: results.fullName, placeM: results.placeM, placeF: results.placeF })
    .from(results)
    .innerJoin(runs, and(eq(runs.slug, results.slug), eq(runs.athleteKey, key)));
  const places: Record<string, number> = {};

  for (const row of rows) {
    const place = row.placeM ?? row.placeF;

    if (place !== null && normalizeAthleteKey(row.fullName) === key) {
      places[row.slug] = place;
    }
  }

  return places;
}

/**
 * The records-page leaderboard source: every ranked athlete with exactly the runs the boards
 * read — one per season, the earliest run of that year's best. `participationSlugs` stays
 * empty (no board reads it), so the participations table is never fetched.
 */
export async function selectAthleteRecords(db: ProtocolDrizzle): Promise<AthleteRecord[]> {
  const yearBests = db.$with('year_bests').as(
    db
      .select({
        athleteKey: runs.athleteKey,
        year: sql<string>`substr(${runs.dateIso}, 1, 4)`.as('year'),
        bestMs: min(runs.timeMs).as('best_ms'),
      })
      .from(runs)
      .where(eq(runs.distanceKm, FIVE_KM_DISTANCE_KM))
      .groupBy(runs.athleteKey, sql`substr(${runs.dateIso}, 1, 4)`),
  );

  const [athleteRows, yearBestRows] = await Promise.all([
    db
      .select({ key: athletes.key, displayName: athletes.displayName, gender: athletes.gender, bestMs: athletes.bestMs })
      .from(athletes)
      .where(isNotNull(athletes.bestMs)),
    db
      .with(yearBests)
      .select({ athleteKey: yearBests.athleteKey, dateIso: min(runs.dateIso), slug: runs.slug, timeMs: yearBests.bestMs })
      .from(yearBests)
      .innerJoin(
        runs,
        and(eq(runs.athleteKey, yearBests.athleteKey), eq(runs.distanceKm, FIVE_KM_DISTANCE_KM), eq(runs.timeMs, yearBests.bestMs)),
      )
      .groupBy(yearBests.athleteKey, sql`${yearBests.year}`),
  ]);
  const runsByKey = new Map<string, AthleteRun[]>();

  for (const yearBest of yearBestRows) {
    const athleteKey = asString(yearBest.athleteKey);
    const seasonRuns = runsByKey.get(athleteKey) ?? [];

    seasonRuns.push({
      dateIso: asString(yearBest.dateIso),
      slug: asString(yearBest.slug),
      timeMs: asNumber(yearBest.timeMs),
      distanceKm: FIVE_KM_DISTANCE_KM,
    });
    runsByKey.set(athleteKey, seasonRuns);
  }

  return athleteRows.map((row) => toLeaderboardRecord(row, runsByKey));
}

/**
 * The course record progression per gender: every 5 km run of a gendered athlete feeds the
 * `courseRecordHistory` scan, which keeps only the record-beating ones. The scan needs the full
 * chronology (a record run later beaten within the same season still held the record for a while),
 * so no per-year rollup can replace this read.
 */
export async function selectCourseRecords(db: ProtocolDrizzle): Promise<CourseRecordHistory> {
  const rows = await db
    .select({
      key: athletes.key,
      displayName: athletes.displayName,
      gender: athletes.gender,
      dateIso: runs.dateIso,
      slug: runs.slug,
      timeMs: runs.timeMs,
    })
    .from(runs)
    .innerJoin(athletes, eq(athletes.key, runs.athleteKey))
    .where(and(eq(runs.distanceKm, FIVE_KM_DISTANCE_KM), isNotNull(athletes.gender)));

  // The SQL filter already dropped genderless athletes; `flatMap` only narrows the type.
  return courseRecordHistory(
    rows.flatMap((row) => {
      const gender = asGender(row.gender);

      return gender === null ? [] : [{ ...row, gender }];
    }),
  );
}

/**
 * The first-lap (2.3 km) record per gender — the fastest recorded split among 5 km finishers.
 * Splits live only in the protocol rows under the organisers' spellings, so the display name is
 * resolved through the athletes table by the normalized key (the protocol spelling is the fallback
 * for a finisher the rollup has not ranked). Old protocols without splits contribute no rows.
 */
export async function selectFirstLapRecords(db: ProtocolDrizzle): Promise<FirstLapRecords> {
  const [rows, athleteRows] = await Promise.all([
    db
      .select({ fullName: results.fullName, time23: results.time23, gender: results.gender, slug: results.slug })
      .from(results)
      .where(and(ne(results.time23, ''), ne(results.time5, ''), isNotNull(results.gender))),
    db.select({ key: athletes.key, displayName: athletes.displayName }).from(athletes),
  ]);
  const displayNames = new Map(athleteRows.map((row) => [row.key, row.displayName]));

  return firstLapRecords(
    rows.flatMap((row) => {
      const gender = asGender(row.gender);
      const lapMs = parseDuration(row.time23);

      if (gender === null || lapMs === null) {
        return [];
      }

      const key = normalizeAthleteKey(row.fullName);

      // The slug doubles as the ISO event date (see `selectEventSlugs`), saving the events join.
      return [{ key, displayName: displayNames.get(key) ?? row.fullName, gender, dateIso: row.slug, slug: row.slug, lapMs }];
    }),
  );
}

/**
 * The athlete's fastest first-lap (2.3 km) split over their 5 km finishes, or null when no run of
 * theirs carries a recorded split. The rows arrive like in `selectAthleteRunPlaces`: joined by the
 * athlete's runs and matched back by the normalized name against the organisers' spelling.
 */
export async function selectAthleteBestFirstLap(db: ProtocolDrizzle, key: string): Promise<AthleteFirstLap | null> {
  const rows = await db
    .select({ slug: results.slug, fullName: results.fullName, time23: results.time23, dateIso: runs.dateIso })
    .from(results)
    .innerJoin(runs, and(eq(runs.slug, results.slug), eq(runs.athleteKey, key)))
    .where(and(ne(results.time23, ''), ne(results.time5, '')));

  return bestFirstLap(
    rows.flatMap((row) => {
      const lapMs = parseDuration(row.time23);

      return lapMs === null || normalizeAthleteKey(row.fullName) !== key ? [] : [{ dateIso: row.dateIso, slug: row.slug, lapMs }];
    }),
  );
}

/**
 * Every finished run (any distance) with the finisher's display name, oldest first — the
 * «Легенда трассы» tally source. The window cut happens in `legendBoard`: the whole run history
 * is a few thousand short rows, so no date filter is worth a second query for the anchor.
 */
export async function selectLegendFinishes(db: ProtocolDrizzle): Promise<LegendFinish[]> {
  return db
    .select({ key: runs.athleteKey, displayName: athletes.displayName, dateIso: runs.dateIso })
    .from(runs)
    .innerJoin(athletes, eq(athletes.key, runs.athleteKey))
    .orderBy(asc(runs.dateIso), asc(runs.athleteKey));
}

/** Every event slug oldest first — the race chronology the streak scan walks (slug = ISO date). */
export async function selectEventSlugs(db: ProtocolDrizzle): Promise<string[]> {
  const rows = await db.select({ slug: events.slug }).from(events).orderBy(asc(events.slug));

  return rows.map((row) => row.slug);
}

/** Year → the date of that year's first race (the new-year one); also the source of the year list. */
export async function selectFirstEventDateByYear(db: ProtocolDrizzle): Promise<Record<string, string>> {
  const rows = await db
    .select({ year: sql<string>`substr(${events.slug}, 1, 4)`, firstDate: min(events.slug) })
    .from(events)
    .groupBy(sql`substr(${events.slug}, 1, 4)`);
  const firstDateByYear: Record<string, string> = {};

  for (const row of rows) {
    firstDateByYear[asString(row.year)] = asString(row.firstDate);
  }

  return firstDateByYear;
}

/** The «Итоги года» page payload: a handful of year-scoped selects boiled down by `buildYearReview`. */
export async function selectYearReview(db: ProtocolDrizzle, year: string): Promise<YearReview> {
  const yearPattern = `${year}-%`;
  const firstParticipations = db.$with('first_participations').as(
    db
      .select({ athleteKey: participations.athleteKey, firstSlug: min(participations.slug).as('first_slug') })
      .from(participations)
      .groupBy(participations.athleteKey),
  );

  const [eventRows, runRows, newcomerRows, personalRecordRows] = await Promise.all([
    db.select({ slug: events.slug }).from(events).where(like(events.slug, yearPattern)).orderBy(asc(events.slug)),
    db
      .select({
        key: runs.athleteKey,
        displayName: athletes.displayName,
        gender: athletes.gender,
        dateIso: runs.dateIso,
        slug: runs.slug,
        timeMs: runs.timeMs,
        distanceKm: runs.distanceKm,
      })
      .from(runs)
      .innerJoin(athletes, eq(athletes.key, runs.athleteKey))
      .where(like(runs.dateIso, yearPattern)),
    db
      .with(firstParticipations)
      .select({ value: count() })
      .from(firstParticipations)
      .where(like(firstParticipations.firstSlug, yearPattern)),
    db
      .select({ value: count() })
      .from(results)
      .where(and(like(results.slug, yearPattern), like(results.note, `%${PERSONAL_RECORD_NOTE_PREFIX}%`))),
  ]);

  // `count()` without GROUP BY always yields exactly one row, so the destructuring never misses.
  const [newcomerCounts] = newcomerRows;
  const [personalRecordCounts] = personalRecordRows;

  return buildYearReview({
    year,
    eventDates: eventRows.map((row) => row.slug),
    runRows: runRows.map((row) => ({ ...row, gender: asGender(row.gender) })),
    newcomerCount: newcomerCounts.value,
    personalRecordCount: personalRecordCounts.value,
  });
}

/** Site-wide totals via SQL aggregates, shaped exactly like `computeOverallStats`. */
export async function selectOverallStats(db: ProtocolDrizzle): Promise<OverallStats> {
  const [runCountsRows, eventCountsRows, medianTimeMenMs, medianTimeWomenMs] = await Promise.all([
    db.select({ finishesCount: count(), finishersCount: countDistinct(runs.athleteKey) }).from(runs),
    db.select({ eventsCount: count() }).from(events),
    selectMedianTimeMs(db, Gender.male),
    selectMedianTimeMs(db, Gender.female),
  ]);
  const [runCounts] = runCountsRows;
  const [eventCounts] = eventCountsRows;
  const finishesCount = runCounts.finishesCount;
  const finishersCount = runCounts.finishersCount;

  return {
    eventsCount: eventCounts.eventsCount,
    finishesCount,
    finishersCount,
    averageFinishes: finishersCount === 0 ? 0 : finishesCount / finishersCount,
    medianTimeMenMs,
    medianTimeWomenMs,
  };
}

/** The archive list, newest first like the JSON index; `limit` serves the home preview. */
export async function selectArchiveEvents(db: ProtocolDrizzle, limit?: number): Promise<ArchiveIndexEntry[]> {
  const base = db
    .select({
      slug: events.slug,
      dateIso: events.dateIso,
      number: events.number,
      legacyNumber: events.legacyNumber,
      city: events.city,
      park: events.park,
      participantCount: events.participantCount,
      finisherCount: events.finisherCount,
      medianTimeMs: events.medianTimeMs,
      medianMaleMs: events.medianMaleMs,
      medianFemaleMs: events.medianFemaleMs,
      bestMaleMs: events.bestMaleMs,
      bestFemaleMs: events.bestFemaleMs,
      newcomerCount: events.newcomerCount,
      personalRecordCount: events.personalRecordCount,
    })
    .from(events)
    .orderBy(desc(events.dateIso))
    .$dynamic();
  const rows = await (limit === undefined ? base : base.limit(limit));

  return rows.map(toArchiveEntry);
}

/** One published event — its metadata plus every protocol row — or null when the slug is unknown. */
export async function selectEventResults(db: ProtocolDrizzle, slug: string): Promise<EventResultsFile | null> {
  const [event] = await db
    .select({
      number: events.number,
      legacyNumber: events.legacyNumber,
      dateIso: events.dateIso,
      city: events.city,
      park: events.park,
      clubName: events.clubName,
      chairman: events.chairman,
    })
    .from(events)
    .where(eq(events.slug, slug));

  if (!event) {
    return null;
  }

  const rows = await db
    .select({
      index: results.idx,
      fullName: results.fullName,
      time23: results.time23,
      time5: results.time5,
      totalMs: results.totalMs,
      distanceKm: results.distanceKm,
      gender: results.gender,
      placeM: results.placeM,
      placeF: results.placeF,
      club: results.club,
      note: results.note,
    })
    .from(results)
    .where(eq(results.slug, slug))
    .orderBy(asc(results.idx));

  return buildEventResultsFile(event, rows.map(toProtocolRow));
}

/**
 * Every 5 km run of every athlete who finished the 5 km at `slug` — the source of the protocol
 * page's on-the-fly notables. Future runs relative to the event stay in: `buildEventNotables`
 * cuts to the event date itself, and the read stays a single indexed join.
 */
export async function selectEventParticipantRuns(db: ProtocolDrizzle, slug: string): Promise<ParticipantRun[]> {
  const eventAthletes = db.$with('event_athletes').as(
    db
      .select({ athleteKey: runs.athleteKey })
      .from(runs)
      .where(and(eq(runs.slug, slug), eq(runs.distanceKm, FIVE_KM_DISTANCE_KM))),
  );

  return db
    .with(eventAthletes)
    .select({ athleteKey: runs.athleteKey, dateIso: runs.dateIso, slug: runs.slug, timeMs: runs.timeMs, distanceKm: runs.distanceKm })
    .from(runs)
    .innerJoin(eventAthletes, eq(eventAthletes.athleteKey, runs.athleteKey))
    .where(eq(runs.distanceKm, FIVE_KM_DISTANCE_KM))
    .orderBy(asc(runs.dateIso));
}

/**
 * Every 5 km finish (with the finisher's display name) at the events `key` finished the 5 km at,
 * the athlete's own rows included — the «Соперники» card source. The close-gap cut and the year
 * filter happen in `closeRivals`, so one read serves every year the page can switch to.
 */
export async function selectRivalRuns(db: ProtocolDrizzle, key: string): Promise<RivalRun[]> {
  const athleteEvents = db.$with('athlete_events').as(
    db
      .select({ slug: runs.slug })
      .from(runs)
      .where(and(eq(runs.athleteKey, key), eq(runs.distanceKm, FIVE_KM_DISTANCE_KM))),
  );

  return db
    .with(athleteEvents)
    .select({ key: runs.athleteKey, displayName: athletes.displayName, dateIso: runs.dateIso, slug: runs.slug, timeMs: runs.timeMs })
    .from(runs)
    .innerJoin(athleteEvents, eq(athleteEvents.slug, runs.slug))
    .innerJoin(athletes, eq(athletes.key, runs.athleteKey))
    .where(eq(runs.distanceKm, FIVE_KM_DISTANCE_KM))
    .orderBy(asc(runs.dateIso), asc(runs.athleteKey));
}

/**
 * athleteKey → 5 km finishes strictly before `dateIso` — the publish-time «Финишей» column source.
 * Strictly before, because the event being published is not stored yet (or, on a republish, must
 * not count twice): `eventFinishCounts` adds the event's own finish itself.
 */
export async function selectFiveKmFinishCountsBefore(db: ProtocolDrizzle, dateIso: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ athleteKey: runs.athleteKey, finishCount: count() })
    .from(runs)
    .where(and(eq(runs.distanceKm, FIVE_KM_DISTANCE_KM), lt(runs.dateIso, dateIso)))
    .groupBy(runs.athleteKey);
  const counts: Record<string, number> = {};

  for (const row of rows) {
    counts[row.athleteKey] = row.finishCount;
  }

  return counts;
}

/**
 * athleteKey → the all-time 5 km best run strictly before `dateIso` — the publish-time source of
 * the dated «ЛР (было X)» note. Strictly before, because the event being published is not stored
 * yet and its own finishes must not shadow the record they beat.
 */
export async function selectPreviousBestsBefore(db: ProtocolDrizzle, dateIso: string): Promise<Record<string, PreviousBest>> {
  const rows = await db
    .select({ athleteKey: runs.athleteKey, dateIso: runs.dateIso, slug: runs.slug, timeMs: runs.timeMs })
    .from(runs)
    .where(and(eq(runs.distanceKm, FIVE_KM_DISTANCE_KM), lt(runs.dateIso, dateIso)));

  return buildPreviousBests(
    rows.map((row) => ({ ...row, distanceKm: FIVE_KM_DISTANCE_KM })),
    dateIso,
  );
}

function toProtocolRow(row: {
  index: number;
  fullName: string;
  time23: string;
  time5: string;
  totalMs: number | null;
  distanceKm: number | null;
  gender: string | null;
  placeM: number | null;
  placeF: number | null;
  club: string;
  note: string;
}): ProtocolRow {
  return {
    index: row.index,
    fullName: row.fullName,
    time23: row.time23,
    time5: row.time5,
    totalMs: row.totalMs,
    distanceKm: row.distanceKm,
    gender: asGender(row.gender),
    placeM: row.placeM,
    placeF: row.placeF,
    club: row.club,
    note: row.note,
  };
}

function toLeaderboardRecord(
  row: { key: string; displayName: string; gender: string | null; bestMs: number | null },
  runsByKey: Map<string, AthleteRun[]>,
): AthleteRecord {
  const runsForKey = runsByKey.get(row.key) ?? [];

  return {
    key: row.key,
    displayName: row.displayName,
    gender: asGender(row.gender),
    participationSlugs: [],
    runs: runsForKey,
    bestMs: row.bestMs,
    bestMsByYear: bestMsByYear(runsForKey),
  };
}

// File paths are not stored in the db — they follow from the date, see `eventFilePaths`.
function toArchiveEntry(row: {
  slug: string;
  dateIso: string;
  number: number;
  legacyNumber: string | null;
  city: string;
  park: string;
  participantCount: number;
  finisherCount: number | null;
  medianTimeMs: number | null;
  medianMaleMs: number | null;
  medianFemaleMs: number | null;
  bestMaleMs: number | null;
  bestFemaleMs: number | null;
  newcomerCount: number | null;
  personalRecordCount: number | null;
}): ArchiveIndexEntry {
  return {
    slug: row.slug,
    dateIso: row.dateIso,
    number: row.number,
    legacyNumber: row.legacyNumber,
    city: row.city,
    park: row.park,
    participantCount: row.participantCount,
    finisherCount: row.finisherCount,
    medianTimeMs: row.medianTimeMs,
    medianMaleMs: row.medianMaleMs,
    medianFemaleMs: row.medianFemaleMs,
    bestMaleMs: row.bestMaleMs,
    bestFemaleMs: row.bestFemaleMs,
    newcomerCount: row.newcomerCount,
    personalRecordCount: row.personalRecordCount,
    files: eventFilePaths(row.dateIso),
  };
}

/** Recomputed from the runs like `athletes-rollup` does: the fastest 5 km time of each year. */
function bestMsByYear(runsForKey: readonly AthleteRun[]): Record<string, number> {
  const bests: Record<string, number> = {};

  for (const run of runsForKey) {
    if (run.distanceKm !== FIVE_KM_DISTANCE_KM) {
      continue;
    }

    const year = isoYear(run.dateIso);
    const yearBestMs: number | undefined = bests[year];

    if (yearBestMs === undefined || run.timeMs < yearBestMs) {
      bests[year] = run.timeMs;
    }
  }

  return bests;
}

/** Rounded like the JSON path rounds the mean of the two middle values; an empty sample is 0. */
async function selectMedianTimeMs(db: ProtocolDrizzle, gender: GenderType): Promise<number> {
  const filter = and(eq(athletes.gender, gender), eq(runs.distanceKm, FIVE_KM_DISTANCE_KM));
  const [{ total }] = await db.select({ total: count() }).from(runs).innerJoin(athletes, eq(athletes.key, runs.athleteKey)).where(filter);

  if (total === 0) {
    return 0;
  }

  const middle = db
    .select({ timeMs: runs.timeMs })
    .from(runs)
    .innerJoin(athletes, eq(athletes.key, runs.athleteKey))
    .where(filter)
    .orderBy(asc(runs.timeMs))
    .limit(2 - (total % 2))
    .offset(Math.floor((total - 1) / 2))
    .as('middle');
  const [{ medianMs }] = await db.select({ medianMs: avg(middle.timeMs) }).from(middle);

  // `total > 0` guarantees the limited subquery has rows, so AVG is non-null; `asNumber` still folds
  // the type-level null to 0 without an extra branch (the `total === 0` guard already returned above).
  return Math.round(asNumber(medianMs));
}
