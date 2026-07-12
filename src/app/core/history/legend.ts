import { LEGEND_WINDOW_DAYS } from './legend.constant';
import { LegendBoard, LegendFinish, LegendProgress, LegendStanding } from './legend.interface';

/**
 * The «Легенда трассы» standings — a transferable Strava-Local-Legends-style title for the most
 * finishes in a rolling window, where the pace never matters. The window is anchored at the
 * archive's newest finish (not the wall clock, so a prerender stays deterministic) and spans
 * `windowDays` calendar days inclusive. A tied count belongs to whoever reached it first — the
 * athlete whose latest windowed finish is older — mirroring how the first setter keeps a course
 * record.
 */
export function legendBoard(finishes: readonly LegendFinish[], windowDays: number = LEGEND_WINDOW_DAYS): LegendBoard {
  let anchorIso = '';

  for (const finish of finishes) {
    if (finish.dateIso > anchorIso) {
      anchorIso = finish.dateIso;
    }
  }

  if (anchorIso === '') {
    return { windowStartIso: '', legend: null, standings: [] };
  }

  const windowStartIso = isoDaysBefore(anchorIso, windowDays - 1);
  const standingByKey = new Map<string, LegendStanding>();

  for (const finish of finishes) {
    if (finish.dateIso < windowStartIso) {
      continue;
    }

    const standing = standingByKey.get(finish.key);

    if (standing === undefined) {
      standingByKey.set(finish.key, { key: finish.key, displayName: finish.displayName, finishCount: 1, lastFinishIso: finish.dateIso });
      continue;
    }

    standing.finishCount += 1;

    if (finish.dateIso > standing.lastFinishIso) {
      standing.lastFinishIso = finish.dateIso;
    }
  }

  // The anchor finish always sits inside its own window, so the standings are never empty here.
  const standings = [...standingByKey.values()].sort(byCrownOrder);

  return { windowStartIso, legend: standings[0], standings };
}

/** One athlete's take on the board: the crown itself, or how many finishes are left to grab it. */
export function legendProgress(board: LegendBoard, athleteKey: string): LegendProgress {
  const standing = board.standings.find((entry) => entry.key === athleteKey) ?? null;
  const finishCount = standing?.finishCount ?? 0;
  const isLegend = board.legend !== null && board.legend.key === athleteKey;
  // Only beating the holder's count takes the title: a tie stays with whoever reached it first.
  const finishesToCrown = isLegend ? 0 : (board.legend?.finishCount ?? 0) - finishCount + 1;

  return { isLegend, finishCount, finishesToCrown, legend: board.legend };
}

/** Most finishes first; a tie goes to the earlier last finish, then the name keeps the order stable. */
function byCrownOrder(left: LegendStanding, right: LegendStanding): number {
  return (
    right.finishCount - left.finishCount ||
    left.lastFinishIso.localeCompare(right.lastFinishIso) ||
    left.displayName.localeCompare(right.displayName)
  );
}

/** The ISO date `days` calendar days before `dateIso`, in UTC so no timezone can shift the window. */
function isoDaysBefore(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().slice(0, 10);
}
