import { AthleteRecord } from '../models/athlete-history.interface';
import { normalizeAthleteKey } from './athlete-key';

/**
 * Name matches for an athlete picker: the query is key-normalized, excluded keys are dropped,
 * the survivors sort alphabetically and cut to `limit`. An empty query suggests nothing —
 * a dropdown with the whole directory would be noise, not help.
 */
export function suggestAthletes(
  options: readonly AthleteRecord[],
  query: string,
  excludedKeys: readonly (string | undefined)[],
  limit: number,
): AthleteRecord[] {
  const normalizedQuery = normalizeAthleteKey(query);

  if (normalizedQuery === '') {
    return [];
  }

  return options
    .filter((option) => option.key.includes(normalizedQuery) && !excludedKeys.includes(option.key))
    .sort((left, right) => left.displayName.localeCompare(right.displayName))
    .slice(0, limit);
}
