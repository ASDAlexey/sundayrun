import { eq } from 'drizzle-orm';

import { isNewcomerNote, isPersonalRecordNote } from '../history/race-summary';
import { events, results } from './protocol-db.schema';
import { ProtocolDrizzle } from './protocol-drizzle';

/** The two note-derived counters of one event, mirroring the `ArchiveIndexEntry` fields. */
interface EventSummaryCounts {
  newcomerCount: number;
  personalRecordCount: number;
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
