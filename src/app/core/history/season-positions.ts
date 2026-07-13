import { GenderType } from '../models/gender.enum';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { SeasonPositionLine, SeasonPositionPoint, SeasonPositions, SeasonRun } from './season-positions.interface';

/**
 * The season standings race for one gender, ready for the bump chart: after every event the
 * athletes rank by their season-best 5 km time (ties break by name like the leaderboard), and
 * every ranked athlete gets a line — anyone can find themselves on the chart. Each point carries
 * the position and the season best behind it. Positions before an athlete's first finish stay
 * null: a line starts at the debut event.
 */
export function buildSeasonPositions(runs: SeasonRun[], gender: GenderType): SeasonPositions {
  const runsByDate = new Map<string, SeasonRun[]>();

  for (const run of runs) {
    if (run.gender === gender) {
      runsByDate.set(run.dateIso, [...(runsByDate.get(run.dateIso) ?? []), run]);
    }
  }

  const eventDates = [...runsByDate.keys()].sort();
  const bests = new Map<string, SeasonRun>();
  const snapshots = eventDates.map((date) => {
    for (const run of runsByDate.get(date) ?? []) {
      const best = bests.get(run.key);

      if (best === undefined || run.timeMs < best.timeMs) {
        bests.set(run.key, run);
      }
    }

    return rankSnapshot(bests);
  });
  const finalSnapshot = snapshots.at(-1) ?? new Map<string, SeasonPositionPoint>();

  return { eventDates, lines: toLines(bests, finalSnapshot, snapshots), rankedCount: finalSnapshot.size };
}

/** Key → the standings point (1-based position, season best), ranked exactly like `bestResults`. */
function rankSnapshot(bests: Map<string, SeasonRun>): Map<string, SeasonPositionPoint> {
  const ranked = [...bests.values()].sort(
    (left, right) => left.timeMs - right.timeMs || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE),
  );

  return new Map(ranked.map((run, index) => [run.key, { position: index + 1, bestMs: run.timeMs }]));
}

/** Every ranked athlete in the final order, each with the point at every event (null pre-debut). */
function toLines(
  bests: Map<string, SeasonRun>,
  finalSnapshot: Map<string, SeasonPositionPoint>,
  snapshots: Map<string, SeasonPositionPoint>[],
): SeasonPositionLine[] {
  return [...bests.values()]
    .map((best) => ({ best, position: finalSnapshot.get(best.key)?.position ?? Number.POSITIVE_INFINITY }))
    .sort((left, right) => left.position - right.position)
    .map(({ best }) => ({
      key: best.key,
      displayName: best.displayName,
      points: snapshots.map((snapshot) => snapshot.get(best.key) ?? null),
    }));
}
