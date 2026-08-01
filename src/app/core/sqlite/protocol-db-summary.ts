import { eq } from 'drizzle-orm';

import { selectPacingRows } from '../../github/protocol-db-pacing';
import { isNewcomerNote, isPersonalRecordNote } from '../history/race-summary';
import { AthletesHistory } from '../models/athletes-history.type';
import { GenderType } from '../models/gender.enum';
import { buildLapStats } from '../timer/lap-stats';
import { LapStats } from '../timer/lap-stats.interface';
import { events, meta, results } from './protocol-db.schema';
import { ProtocolDrizzle } from './protocol-drizzle';

/** The two note-derived counters of one event, mirroring the `ArchiveIndexEntry` fields. */
interface EventSummaryCounts {
  newcomerCount: number;
  personalRecordCount: number;
}

/**
 * The `meta` key holding the stopwatch's whole athlete directory, materialised at write time so
 * /timer opens with one keyed row instead of two unindexed full scans (`selectAthleteRecords` over
 * `runs`, `selectPacingRows` over `results`) — roughly 130 sequential range requests on the one
 * route designed for a park with no signal.
 *
 * The shape version rides in the key itself rather than in a field: a reader asking for `V1` finds
 * nothing both in an archive published before this row existed and in one written to a later shape,
 * and falls back to the two scans in either case. A superseded row would linger until the next
 * schema migration sweeps it — a few dozen kilobytes, paid by nobody who does not ask for the key.
 */
export const PROTOCOL_DB_META_TIMER_ROSTER_KEY = 'timerRosterV1';

/** One directory entry — the whole of an `AthleteRecord` the roster sheet and the tile order read. */
export interface TimerRosterAthlete {
  key: string;
  displayName: string;
  gender: GenderType | null;
}

/** The materialised roster: who the archive knows, plus the four maps `buildLapStats` yields. */
export interface TimerRosterSummary extends LapStats {
  athletes: TimerRosterAthlete[];
}

/** The row as it travels through JSON: a `Map` does not survive `stringify`, so each one goes as pairs. */
interface StoredTimerRoster {
  athletes: TimerRosterAthlete[];
  expectedLapMs: [string, number][];
  bestLapMs: [string, number][];
  appearanceCount: [string, number][];
  courseRecordLapMs: Readonly<Record<GenderType, number | null>>;
}

/**
 * Refreshes every event's newcomer/record counters from the stored notes. Runs right after
 * `recomputeStoredNotes` in the same transaction: any publication or removal can shift later
 * events' notes, so the counters of the WHOLE archive converge together with them — the entry
 * `buildIndexEntry` wrote for the published event is only provisional until this pass.
 */
export async function recomputeEventSummaryCounts(db: ProtocolDrizzle): Promise<void> {
  const noteRows = await db.select({ slug: results.slug, note: results.note }).from(results);
  const eventRows = await db.select({ slug: events.slug }).from(events);
  const countsBySlug = new Map<string, EventSummaryCounts>();

  for (const row of noteRows) {
    const counts = countsBySlug.get(row.slug) ?? { newcomerCount: 0, personalRecordCount: 0 };

    counts.newcomerCount += isNewcomerNote(row.note) ? 1 : 0;
    counts.personalRecordCount += isPersonalRecordNote(row.note) ? 1 : 0;
    countsBySlug.set(row.slug, counts);
  }

  for (const { slug } of eventRows) {
    const counts = countsBySlug.get(slug) ?? { newcomerCount: 0, personalRecordCount: 0 };

    await db.update(events).set(counts).where(eq(events.slug, slug));
  }
}

/**
 * Materialises the stopwatch's directory into `PROTOCOL_DB_META_TIMER_ROSTER_KEY`, next to
 * `storeOverallStats` in the publish transaction, so the stored row always matches the tables.
 *
 * The laps come from the very `selectPacingRows` the client fallback runs, boiled down by the very
 * `buildLapStats` it calls: sharing both is what guarantees the two paths cannot drift, and the
 * scan is free here — the db is a local in-memory image, not a file behind range requests. The
 * names come from the rollup the tables were just written from, filtered the way
 * `selectAthleteRecords` filters them, so the sheet lists the same people whichever path filled it.
 */
export async function storeTimerRoster(db: ProtocolDrizzle, history: AthletesHistory): Promise<void> {
  const stats = buildLapStats(await selectPacingRows(db));
  const stored: StoredTimerRoster = {
    athletes: rosterAthletes(history),
    expectedLapMs: [...stats.expectedLapMs],
    bestLapMs: [...stats.bestLapMs],
    appearanceCount: [...stats.appearanceCount],
    courseRecordLapMs: stats.courseRecordLapMs,
  };
  const value = JSON.stringify(stored);

  await db.insert(meta).values({ key: PROTOCOL_DB_META_TIMER_ROSTER_KEY, value }).onConflictDoUpdate({ target: meta.key, set: { value } });
}

/** The materialised roster, or null when this archive carries no row of this shape (see the key). */
export async function selectTimerRoster(db: ProtocolDrizzle): Promise<TimerRosterSummary | null> {
  const [row] = await db.select({ value: meta.value }).from(meta).where(eq(meta.key, PROTOCOL_DB_META_TIMER_ROSTER_KEY));
  const stored: StoredTimerRoster | null = row ? JSON.parse(row.value) : null;

  if (stored === null) {
    return null;
  }

  return {
    athletes: stored.athletes,
    expectedLapMs: new Map(stored.expectedLapMs),
    bestLapMs: new Map(stored.bestLapMs),
    appearanceCount: new Map(stored.appearanceCount),
    courseRecordLapMs: stored.courseRecordLapMs,
  };
}

/**
 * Everyone the records-page read would have listed: `selectAthleteRecords` keeps only athletes with
 * a 5 km best, so a run-less DNF entry is no more a name to search here than it is there.
 */
function rosterAthletes(history: AthletesHistory): TimerRosterAthlete[] {
  return Object.values(history).flatMap((record) =>
    record.bestMs === null ? [] : [{ key: record.key, displayName: record.displayName, gender: record.gender }],
  );
}
