import { AthleteRecord } from '../models/athlete-history.interface';
import { normalizeAthleteKey } from './athlete-key';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { AthletesSort, AthletesSortType } from './athletes-list.enum';

/**
 * Substring search over athlete keys; the query goes through the same `normalizeAthleteKey`
 * normalization (case, whitespace, 'ё'), so 'Ёлкина' finds 'елкина'. An empty (or
 * whitespace-only) query keeps every record.
 */
export function searchAthletes(records: AthleteRecord[], query: string): AthleteRecord[] {
  const normalizedQuery = normalizeAthleteKey(query);

  if (normalizedQuery === '') {
    return records;
  }

  return records.filter((record) => record.key.includes(normalizedQuery));
}

/**
 * Returns a NEW sorted array (the input is never mutated). `bestTime`: fastest 5 km best
 * first, athletes without one (DNF/2.3 km only) go last; `participations`: most events
 * first. Ties break by display name in Russian collation.
 */
export function sortAthletes(records: AthleteRecord[], sort: AthletesSortType): AthleteRecord[] {
  return [...records].sort(sort === AthletesSort.bestTime ? compareByBestTime : compareByParticipations);
}

function compareByBestTime(left: AthleteRecord, right: AthleteRecord): number {
  if (left.bestMs === null || right.bestMs === null) {
    return compareNullableBests(left, right);
  }

  return left.bestMs - right.bestMs || compareByDisplayName(left, right);
}

/** At least one side has no best: null sinks below any time, two nulls fall back to the name. */
function compareNullableBests(left: AthleteRecord, right: AthleteRecord): number {
  if (left.bestMs === right.bestMs) {
    return compareByDisplayName(left, right);
  }

  return left.bestMs === null ? 1 : -1;
}

function compareByParticipations(left: AthleteRecord, right: AthleteRecord): number {
  return right.participationSlugs.length - left.participationSlugs.length || compareByDisplayName(left, right);
}

function compareByDisplayName(left: AthleteRecord, right: AthleteRecord): number {
  return left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE);
}
