import { COMEBACK_MIN_BREAK_DAYS, MS_IN_DAY } from './badge-signals.constant';
import { AthleteBadgeSignals, BadgeSignalRun, HistoryRunRow } from './badge-signals.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import { medianMsOrNull } from './median';

/**
 * The cross-year badge signals: unlike the run counts of `YearActivity`, these need the whole
 * run history — a comeback break may span the New Year, and the «медленнее своей медианы» cut
 * compares a year's finishes against the athlete's all-time 5 km median.
 */

/**
 * Years holding a comeback run — a finish whose break from the athlete's previous finish (any
 * distance) is three months and more. The first finish ever opens no break, so it never counts.
 */
export function comebackYearsOf(runs: readonly BadgeSignalRun[]): Set<string> {
  const dates = [...new Set(runs.map((run) => run.dateIso))].sort();
  const years = new Set<string>();

  for (let index = 1; index < dates.length; index++) {
    if (Date.parse(dates[index]) - Date.parse(dates[index - 1]) >= COMEBACK_MIN_BREAK_DAYS * MS_IN_DAY) {
      years.add(isoYear(dates[index]));
    }
  }

  return years;
}

/**
 * Year → the 5 km finishes strictly slower than the athlete's all-time 5 km median. Roughly half
 * of anyone's career sits below their own median, so the count only piles up in a season the
 * athlete kept showing up slower than their usual self.
 */
export function slowFinishCountsOf(runs: readonly BadgeSignalRun[]): Record<string, number> {
  const fiveKm = runs.filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM);
  const median = medianMsOrNull(fiveKm.map((run) => run.timeMs));
  const countByYear: Record<string, number> = {};

  if (median === null) {
    return countByYear;
  }

  for (const run of fiveKm) {
    if (run.timeMs > median) {
      countByYear[isoYear(run.dateIso)] = (countByYear[isoYear(run.dateIso)] ?? 0) + 1;
    }
  }

  return countByYear;
}

const EMPTY_SIGNALS: AthleteBadgeSignals = { comebackYears: new Set(), slowFinishCountByYear: {} };

/** One athlete's signals out of the archive-wide map; an athlete without runs carries none. */
export function athleteSignalsOf(signals: ReadonlyMap<string, AthleteBadgeSignals>, athleteKey: string): AthleteBadgeSignals {
  return signals.get(athleteKey) ?? EMPTY_SIGNALS;
}

/** Both signals per athlete over the whole archive's finished runs. */
export function badgeSignalsByAthlete(rows: readonly HistoryRunRow[]): Map<string, AthleteBadgeSignals> {
  const runsByAthlete = new Map<string, HistoryRunRow[]>();

  for (const row of rows) {
    const athleteRows = runsByAthlete.get(row.athleteKey);

    if (athleteRows === undefined) {
      runsByAthlete.set(row.athleteKey, [row]);
    } else {
      athleteRows.push(row);
    }
  }

  const signals = new Map<string, AthleteBadgeSignals>();

  for (const [athleteKey, athleteRows] of runsByAthlete) {
    signals.set(athleteKey, { comebackYears: comebackYearsOf(athleteRows), slowFinishCountByYear: slowFinishCountsOf(athleteRows) });
  }

  return signals;
}
