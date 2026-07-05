import { AthleteRecord } from '../models/athlete-history.interface';
import { GenderType } from '../models/gender.enum';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { BestResult } from './best-results.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';

/**
 * The all-time 5 km leaderboard for one gender: fastest bests first (ties break by name in
 * Russian collation), at most `limit` rows. Athletes without a finished 5 km run are skipped;
 * each row carries the earliest run where the best was set, so the record date is stable.
 */
export function topBestResults(records: AthleteRecord[], gender: GenderType, limit: number): BestResult[] {
  return records
    .reduce<BestResult[]>((results, record) => {
      if (record.gender === gender && record.bestMs !== null) {
        results.push(toBestResult(record));
      }

      return results;
    }, [])
    .sort((left, right) => left.bestMs - right.bestMs || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE))
    .slice(0, limit);
}

function toBestResult(record: AthleteRecord): BestResult {
  const bestRun = record.runs
    .filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM && run.timeMs === record.bestMs)
    .reduce((earliest, run) => (run.dateIso < earliest.dateIso ? run : earliest));

  return {
    key: record.key,
    displayName: record.displayName,
    bestMs: record.bestMs ?? 0,
    dateIso: bestRun.dateIso,
    slug: bestRun.slug,
  };
}
