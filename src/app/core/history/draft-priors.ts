import { normalizeAthleteKey } from './athlete-key';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { DraftRows } from './draft-priors.interface';
import { PreviousBest } from './previous-bests.interface';

/**
 * The stored prior finish counts supplemented with the earlier drafts of the same upload batch:
 * none of them is in the db yet, but on the later draft's race day their finishes had already
 * happened, so the «Финишей» column counts them exactly as it would after publishing one by one.
 */
export function finishCountsWithDrafts(prior: Record<string, number>, earlierDrafts: DraftRows[]): Record<string, number> {
  const counts = { ...prior };

  for (const draft of earlierDrafts) {
    for (const row of draft.rows) {
      if (row.distanceKm === FIVE_KM_DISTANCE_KM && row.totalMs !== null) {
        const key = normalizeAthleteKey(row.fullName);

        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
  }

  return counts;
}

/**
 * The stored previous bests supplemented with the earlier drafts of the same upload batch, so a
 * personal record set earlier in the batch dates the later draft's «ЛР (было X)» note correctly.
 * Drafts are expected oldest first — the order `draftRowsBefore` returns them in.
 */
export function previousBestsWithDrafts(prior: Record<string, PreviousBest>, earlierDrafts: DraftRows[]): Record<string, PreviousBest> {
  const bests = { ...prior };

  for (const draft of earlierDrafts) {
    for (const row of draft.rows) {
      if (row.distanceKm !== FIVE_KM_DISTANCE_KM || row.totalMs === null) {
        continue;
      }

      const key = normalizeAthleteKey(row.fullName);
      const best = bests[key];

      if (best === undefined || row.totalMs < best.timeMs) {
        bests[key] = { slug: draft.dateIso, dateIso: draft.dateIso, timeMs: row.totalMs };
      }
    }
  }

  return bests;
}
