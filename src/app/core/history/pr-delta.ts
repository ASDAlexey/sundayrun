import { isoYear } from './iso-year';
import { PrDeltaKind } from './pr-delta.enum';
import { PrDelta } from './pr-delta.interface';
import { PreviousBest } from './previous-bests.interface';
import { signedRaceTime } from './signed-delta';

/**
 * How far a result landed from the personal record it was chasing — «20:17 (+0:31)» — the figure
 * the protocol shows beside the finish time.
 *
 * The record is always the one standing *before* the race, never the athlete's record today: a
 * protocol read years later has to say what the runner knew on the start line, and a result that
 * took the record has to show by how much it did («−0:21»), which a record measured against itself
 * never could. Null — a blank cell — for a debut with nothing to compare against and for every row
 * without a 5 km time of its own.
 */
export function prDelta(timeMs: number | null, previousBestMs: number | undefined): PrDelta | null {
  if (timeMs === null || previousBestMs === undefined) {
    return null;
  }

  const deltaMs = timeMs - previousBestMs;
  const text = signedRaceTime(deltaMs);

  if (deltaMs < 0) {
    return { kind: PrDeltaKind.faster, text };
  }

  if (deltaMs > 0) {
    return { kind: PrDeltaKind.slower, text };
  }

  return { kind: PrDeltaKind.equal, text };
}

/**
 * Slug → the run holding the athlete's 5 km record before that race, for a whole career at once:
 * the runs table measures every row against the record as it stood that morning, so the same run
 * keeps the same figure whatever order or year filter the table is showing.
 *
 * Runs sharing a date all look past each other — only strictly earlier days count — and a time tie
 * keeps the earlier run, both matching `buildPreviousBests`. The debut has no entry at all.
 */
export function previousBestBySlug(runs: readonly PreviousBest[]): Map<string, PreviousBest> {
  const ordered = [...runs].sort((left, right) => left.dateIso.localeCompare(right.dateIso));
  const bests = new Map<string, PreviousBest>();
  let best: PreviousBest | null = null;
  // The first run not yet folded into `best`; it only ever moves forward, over the ordered list.
  let boundary = 0;

  for (const run of ordered) {
    while (boundary < ordered.length && ordered[boundary].dateIso < run.dateIso) {
      const earlier = ordered[boundary];

      best = best === null || earlier.timeMs < best.timeMs ? earlier : best;
      boundary += 1;
    }

    if (best !== null) {
      bests.set(run.slug, best);
    }
  }

  return bests;
}

/**
 * The same map bounded to each run's own year — the season figure the «Δ ЛР» hint names beside the
 * all-time record. Every January starts empty by design: the first race of a year has no season
 * behind it yet, which is exactly why the column itself measures against the all-time record.
 */
export function previousYearBestBySlug(runs: readonly PreviousBest[]): Map<string, PreviousBest> {
  const byYear = new Map<string, PreviousBest[]>();

  for (const run of runs) {
    const year = isoYear(run.dateIso);
    const yearRuns = byYear.get(year) ?? [];

    yearRuns.push(run);
    byYear.set(year, yearRuns);
  }

  const bests = new Map<string, PreviousBest>();

  for (const yearRuns of byYear.values()) {
    for (const [slug, best] of previousBestBySlug(yearRuns)) {
      bests.set(slug, best);
    }
  }

  return bests;
}
