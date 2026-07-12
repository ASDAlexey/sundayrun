import { and, asc, eq } from 'drizzle-orm';

import { DNF_DISTANCE_KM } from '../github/results-file.constant';
import { normalizeAthleteKey } from '../history/athlete-key';
import { applyEventToHistory } from '../history/athletes-rollup';
import { EventResult } from '../history/athletes-rollup.interface';
import { buildEventAutoNotes } from '../history/event-auto-notes';
import { mergeAutoNote } from '../history/note-merge';
import { AutoNoteInput } from '../history/notes-builder.interface';
import { AthletesHistory } from '../models/athletes-history.type';
import { GenderType } from '../models/gender.enum';
import { results } from './protocol-db.schema';
import { AUTO_NOTES_BASELINE_ISO } from './protocol-db-notes.constant';
import { asGender } from './protocol-db-read';
import { ProtocolDrizzle } from './protocol-drizzle';

/** The slice of a stored result row the note recompute needs. */
interface StoredResult {
  slug: string;
  idx: number;
  fullName: string;
  gender: GenderType | null;
  timeMs: number | null;
  distanceKm: number | null;
  note: string;
}

/**
 * Recomputes the auto notes of EVERY stored result by replaying the whole archive
 * chronologically, so adding, re-publishing or deleting any event refreshes the notes of all
 * later events too — a removed first participation, record run or year best shifts them.
 * Stored manual tokens are preserved (see `mergeAutoNote`); events before
 * `AUTO_NOTES_BASELINE_ISO` are never rewritten but still feed the replayed history.
 * Runs inside the caller's transaction, right after the results converge on the new state.
 */
export async function recomputeStoredNotes(db: ProtocolDrizzle): Promise<void> {
  const eventsRows = groupBySlug(await readStoredResults(db));
  let history: AthletesHistory = {};

  for (const [slug, rows] of eventsRows) {
    if (slug >= AUTO_NOTES_BASELINE_ISO) {
      await updateEventNotes(db, slug, rows, history);
    }

    // Published slugs are the events' ISO dates, so the slug doubles as the event date.
    history = applyEventToHistory(history, { slug, dateIso: slug }, rows.map(toEventResult));
  }
}

async function readStoredResults(db: ProtocolDrizzle): Promise<StoredResult[]> {
  const rows = await db
    .select({
      slug: results.slug,
      idx: results.idx,
      fullName: results.fullName,
      totalMs: results.totalMs,
      distanceKm: results.distanceKm,
      gender: results.gender,
      note: results.note,
    })
    .from(results)
    .orderBy(asc(results.slug), asc(results.idx));

  return rows.map((row) => ({
    slug: row.slug,
    idx: row.idx,
    fullName: row.fullName,
    gender: asGender(row.gender),
    timeMs: row.totalMs,
    distanceKm: row.distanceKm,
    note: row.note,
  }));
}

/** Rows come out sorted by slug, so the map keeps the chronological order of the replay. */
function groupBySlug(rows: StoredResult[]): Map<string, StoredResult[]> {
  const bySlug = new Map<string, StoredResult[]>();

  for (const row of rows) {
    const eventRows = bySlug.get(row.slug);

    if (eventRows === undefined) {
      bySlug.set(row.slug, [row]);
    } else {
      eventRows.push(row);
    }
  }

  return bySlug;
}

/** Merges the recomputed auto notes into one event's rows and writes back only the rows that changed. */
async function updateEventNotes(db: ProtocolDrizzle, slug: string, rows: StoredResult[], history: AthletesHistory): Promise<void> {
  const autoNotes = buildEventAutoNotes(rows.map(toAutoNoteInput), history, slug);

  for (const [index, row] of rows.entries()) {
    const note = mergeAutoNote(autoNotes[index], row.note);

    if (note !== row.note) {
      await db
        .update(results)
        .set({ note })
        .where(and(eq(results.slug, slug), eq(results.idx, row.idx)));
    }
  }
}

function toAutoNoteInput(row: StoredResult): AutoNoteInput {
  return {
    key: normalizeAthleteKey(row.fullName),
    gender: row.gender,
    timeMs: row.timeMs,
    distanceKm: row.distanceKm ?? DNF_DISTANCE_KM,
    dateIso: row.slug,
  };
}

function toEventResult(row: StoredResult): EventResult {
  return {
    fullName: row.fullName,
    gender: row.gender,
    timeMs: row.timeMs,
    distanceKm: row.distanceKm ?? DNF_DISTANCE_KM,
  };
}
