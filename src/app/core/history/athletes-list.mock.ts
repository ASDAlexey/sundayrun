import { AthleteRecord } from '../models/athlete-history.interface';
import { normalizeAthleteKey } from './athlete-key';

/** The fastest 5 km best and the fewest non-DNF participations. */
export const FAST_RUNNER = makeRecord('Иванов Иван', 1440000, 2);

/** Ties with `TIED_LATE_NAME` on both the best time and the participation count; wins by name. */
export const TIED_EARLY_NAME = makeRecord('Быстров Борис', 1500000, 3);

export const TIED_LATE_NAME = makeRecord('Ёлкина Алёна', 1500000, 3);

/** No 5 km best (DNF/2.3 km only); ties with `NO_BEST_LATE_NAME`, wins by name. */
export const NO_BEST_EARLY_NAME = makeRecord('Сошедший Атлет', null, 1);

export const NO_BEST_LATE_NAME = makeRecord('Янов Яков', null, 1);

/** Deliberately unsorted input for both search and sort. */
export const ATHLETES: AthleteRecord[] = [TIED_LATE_NAME, FAST_RUNNER, NO_BEST_LATE_NAME, TIED_EARLY_NAME, NO_BEST_EARLY_NAME];

/** Denormalized query matching `TIED_LATE_NAME` only ('ё' → 'е', case, padding). */
export const DENORMALIZED_QUERY = ' ЁЛКИНА ';

/** An inner substring hitting three keys at once. */
export const SUBSTRING_QUERY = 'ов';

export const NO_MATCH_QUERY = 'нет такого';

/** `SUBSTRING_QUERY` matches in the input order. */
export const EXPECTED_SUBSTRING_MATCHES: AthleteRecord[] = [FAST_RUNNER, NO_BEST_LATE_NAME, TIED_EARLY_NAME];

/** Fastest best first, athletes without a best last, ties by name. */
export const EXPECTED_BEST_TIME_ORDER: AthleteRecord[] = [
  FAST_RUNNER,
  TIED_EARLY_NAME,
  TIED_LATE_NAME,
  NO_BEST_EARLY_NAME,
  NO_BEST_LATE_NAME,
];

/** Most participations first, ties by name. */
export const EXPECTED_PARTICIPATIONS_ORDER: AthleteRecord[] = [
  TIED_EARLY_NAME,
  TIED_LATE_NAME,
  FAST_RUNNER,
  NO_BEST_EARLY_NAME,
  NO_BEST_LATE_NAME,
];

function makeRecord(displayName: string, bestMs: number | null, participationCount: number): AthleteRecord {
  return {
    key: normalizeAthleteKey(displayName),
    displayName,
    gender: null,
    participationSlugs: Array.from({ length: participationCount }, (_, index) => `slug-${index}`),
    runs: [],
    bestMs,
    bestMsByYear: {},
  };
}
