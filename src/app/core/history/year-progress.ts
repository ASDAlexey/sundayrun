import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { HistoryRunRow } from './badge-signals.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import { medianMs } from './median';
import { PROGRESS_MIN_SEASON_FINISHES, YEAR_PROGRESS_LIMIT } from './year-progress.constant';
import { YearProgressRow } from './year-progress.interface';

/**
 * The «Прогресс года» board: athletes whose 5 km season median improved on the previous season,
 * biggest improvement first (a delta tie breaks by name). Both seasons must hold at least
 * `PROGRESS_MIN_SEASON_FINISHES` finishes, so one lucky race cannot pose as progress — this is
 * the mid-pack's nomination by design: it needs no podium, only beating one's own last year.
 * Names come from the reviewed year's runs, so a previous-season-only athlete never surfaces.
 */
export function yearProgressBoard(
  year: string,
  displayNames: ReadonlyMap<string, string>,
  historyRows: readonly HistoryRunRow[],
): YearProgressRow[] {
  const previousYear = String(Number(year) - 1);
  const currentTimes = seasonTimesOf(historyRows, year);
  const previousTimes = seasonTimesOf(historyRows, previousYear);
  const rows: YearProgressRow[] = [];

  for (const [key, timesMs] of currentTimes) {
    const previous = previousTimes.get(key);
    const displayName = displayNames.get(key);

    if (
      displayName === undefined ||
      previous === undefined ||
      timesMs.length < PROGRESS_MIN_SEASON_FINISHES ||
      previous.length < PROGRESS_MIN_SEASON_FINISHES
    ) {
      continue;
    }

    const previousMedianMs = medianMs(previous);
    const currentMedianMs = medianMs(timesMs);
    const deltaMs = previousMedianMs - currentMedianMs;

    if (deltaMs > 0) {
      rows.push({ key, displayName, previousMedianMs, currentMedianMs, deltaMs });
    }
  }

  return rows
    .sort((left, right) => right.deltaMs - left.deltaMs || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE))
    .slice(0, YEAR_PROGRESS_LIMIT);
}

function seasonTimesOf(historyRows: readonly HistoryRunRow[], year: string): Map<string, number[]> {
  const timesByAthlete = new Map<string, number[]>();

  for (const row of historyRows) {
    if (row.distanceKm !== FIVE_KM_DISTANCE_KM || isoYear(row.dateIso) !== year) {
      continue;
    }

    const timesMs = timesByAthlete.get(row.athleteKey);

    if (timesMs === undefined) {
      timesByAthlete.set(row.athleteKey, [row.timeMs]);
    } else {
      timesMs.push(row.timeMs);
    }
  }

  return timesByAthlete;
}
