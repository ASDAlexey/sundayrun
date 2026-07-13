import { AthleteRun } from '../models/athlete-history.interface';
import { MS_IN_SECOND, SECONDS_IN_MINUTE } from '../time/duration.constant';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import { KM_TENTHS_BASE } from './lifetime-aggregates.constant';
import { LifetimeAggregates, MinuteBucket, YearPace } from './lifetime-aggregates.interface';

/**
 * «Цифры за всё время»: the lifetime totals over every finish (the short course included) plus
 * the 5 km-only distributions — the minute histogram and the mean pace per year. The mean (not
 * the usual median) is deliberate here: a slow year should read slow.
 */
export function lifetimeAggregates(runs: AthleteRun[]): LifetimeAggregates {
  const fiveKmRuns = runs.filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM);

  return {
    totalTimeMs: runs.reduce((sum, run) => sum + run.timeMs, 0),
    totalKm: runs.reduce((tenths, run) => tenths + Math.round(run.distanceKm * KM_TENTHS_BASE), 0) / KM_TENTHS_BASE,
    minuteBuckets: toMinuteBuckets(fiveKmRuns),
    yearPaces: toYearPaces(fiveKmRuns),
  };
}

/** One bucket per whole minute between the fastest and the slowest result; a skipped minute stays a zero bar. */
function toMinuteBuckets(runs: AthleteRun[]): MinuteBucket[] {
  if (runs.length === 0) {
    return [];
  }

  const msInMinute = MS_IN_SECOND * SECONDS_IN_MINUTE;
  const counts = new Map<number, number>();

  for (const run of runs) {
    const minute = Math.floor(run.timeMs / msInMinute);

    counts.set(minute, (counts.get(minute) ?? 0) + 1);
  }

  const minutes = [...counts.keys()];
  const buckets: MinuteBucket[] = [];

  for (let minute = Math.min(...minutes); minute <= Math.max(...minutes); minute++) {
    buckets.push({ minute, count: counts.get(minute) ?? 0 });
  }

  return buckets;
}

function toYearPaces(runs: AthleteRun[]): YearPace[] {
  const timesByYear = new Map<string, number[]>();

  for (const run of runs) {
    const year = isoYear(run.dateIso);

    timesByYear.set(year, [...(timesByYear.get(year) ?? []), run.timeMs]);
  }

  return [...timesByYear.entries()]
    .map(([year, times]) => ({
      year,
      paceMsPerKm: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length / FIVE_KM_DISTANCE_KM),
    }))
    .sort((left, right) => left.year.localeCompare(right.year));
}
