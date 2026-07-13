import { isoYear } from './iso-year';
import { CLOSE_FINISH_GAP_MS, RIVAL_MIN_CLOSE_COUNT, RIVALS_LIMIT } from './rivals.constant';
import { Rival, RivalRun, RivalTally } from './rivals.interface';

/**
 * «Соперники»: who finished next to the athlete most often. Every event both sides finished on the
 * full 5 km course within CLOSE_FINISH_GAP_MS of each other counts as a close finish; rivals are
 * ranked by that count, a tied count goes to the smaller gap total (the closer duel), then to the
 * name. A rival needs RIVAL_MIN_CLOSE_COUNT close finishes, the card takes the top RIVALS_LIMIT.
 * `year` narrows the scan to one season; null spans the whole history. The rows are expected to be
 * 5 km finishes only — the db read (`selectRivalRuns`) filters the distance on both sides.
 */
export function closeRivals(rows: RivalRun[], athleteKey: string, year: string | null): Rival[] {
  const scoped = year === null ? rows : rows.filter((row) => isoYear(row.dateIso) === year);
  const ownMsBySlug = scoped.reduce(
    (bySlug, row) => (row.key === athleteKey ? bySlug.set(row.slug, row.timeMs) : bySlug),
    new Map<string, number>(),
  );
  const tallies = new Map<string, RivalTally>();

  for (const row of scoped) {
    const ownMs = row.key === athleteKey ? undefined : ownMsBySlug.get(row.slug);

    if (ownMs === undefined) {
      continue;
    }

    const gapMs = Math.abs(row.timeMs - ownMs);

    if (gapMs > CLOSE_FINISH_GAP_MS) {
      continue;
    }

    const tally = tallies.get(row.key) ?? {
      key: row.key,
      displayName: row.displayName,
      closeCount: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      gapSumMs: 0,
    };

    tally.closeCount += 1;
    tally.gapSumMs += gapMs;
    tally.wins += ownMs < row.timeMs ? 1 : 0;
    tally.losses += row.timeMs < ownMs ? 1 : 0;
    tally.draws += row.timeMs === ownMs ? 1 : 0;
    tallies.set(row.key, tally);
  }

  return [...tallies.values()]
    .filter((tally) => tally.closeCount >= RIVAL_MIN_CLOSE_COUNT)
    .sort(compareRivals)
    .slice(0, RIVALS_LIMIT)
    .map(toRival);
}

function compareRivals(left: RivalTally, right: RivalTally): number {
  return right.closeCount - left.closeCount || left.gapSumMs - right.gapSumMs || left.displayName.localeCompare(right.displayName);
}

function toRival(tally: RivalTally): Rival {
  return {
    key: tally.key,
    displayName: tally.displayName,
    closeCount: tally.closeCount,
    wins: tally.wins,
    losses: tally.losses,
    draws: tally.draws,
  };
}
