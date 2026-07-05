import { AthleteRun } from '../models/athlete-history.interface';
import { RunsSort, RunsSortType } from './athlete-runs.enum';
import { YearBestEntry } from './athlete-runs.interface';
import { isoYear } from './iso-year';

/** Distinct years the athlete ran in, newest first. */
export function distinctRunYears(runs: AthleteRun[]): string[] {
  return [...new Set(runs.map((run) => isoYear(run.dateIso)))].sort(compareYearsDescending);
}

/** Keeps runs of the selected year and distance; a null filter means "everything". */
export function filterRuns(runs: AthleteRun[], year: string | null, distanceKm: number | null): AthleteRun[] {
  return runs.filter((run) => (year === null || isoYear(run.dateIso) === year) && (distanceKm === null || run.distanceKm === distanceKm));
}

/** Returns a NEW sorted array (the input is never mutated); `byDate`: newest first, `byTime`: fastest first. */
export function sortRuns(runs: AthleteRun[], sort: RunsSortType): AthleteRun[] {
  return [...runs].sort(sort === RunsSort.byDate ? compareByDateDescending : compareByTimeAscending);
}

/** `bestMsByYear` flattened into entries, newest year first. */
export function yearBestEntries(bestMsByYear: Record<string, number>): YearBestEntry[] {
  return Object.entries(bestMsByYear)
    .map(([year, timeMs]) => ({ year, timeMs }))
    .sort((left, right) => compareYearsDescending(left.year, right.year));
}

function compareYearsDescending(left: string, right: string): number {
  return right.localeCompare(left);
}

function compareByDateDescending(left: AthleteRun, right: AthleteRun): number {
  return right.dateIso.localeCompare(left.dateIso);
}

function compareByTimeAscending(left: AthleteRun, right: AthleteRun): number {
  return left.timeMs - right.timeMs;
}
