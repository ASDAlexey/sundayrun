import { AthleteRecord } from '../models/athlete-history.interface';
import { GenderType } from '../models/gender.enum';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { BestResult } from './best-results.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';

/**
 * The full 5 km leaderboard for one gender: fastest bests first (ties break by name in Russian
 * collation). `year` narrows it to bests set in that year (`bestMsByYear`); `null` ranks
 * all-time bests. Athletes without a matching finished 5 km run are skipped; each row carries
 * the earliest run where the best was set, so the record date is stable.
 */
export function bestResults(records: AthleteRecord[], gender: GenderType, year: string | null): BestResult[] {
  return records
    .reduce<BestResult[]>((results, record) => {
      const bestMs = year === null ? record.bestMs : (record.bestMsByYear[year] ?? null);

      if (record.gender === gender && bestMs !== null) {
        results.push(toBestResult(record, bestMs, year));
      }

      return results;
    }, [])
    .sort((left, right) => left.bestMs - right.bestMs || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE));
}

/** Years that have at least one 5 km best, newest first — the options of the year filter. */
export function bestResultYears(records: AthleteRecord[]): string[] {
  const years = new Set(records.flatMap((record) => Object.keys(record.bestMsByYear)));

  return [...years].sort((left, right) => right.localeCompare(left));
}

function toBestResult(record: AthleteRecord, bestMs: number, year: string | null): BestResult {
  const bestRun = record.runs
    .filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM && run.timeMs === bestMs && (year === null || isoYear(run.dateIso) === year))
    .reduce((earliest, run) => (run.dateIso < earliest.dateIso ? run : earliest));

  return {
    key: record.key,
    displayName: record.displayName,
    bestMs,
    dateIso: bestRun.dateIso,
    slug: bestRun.slug,
  };
}
