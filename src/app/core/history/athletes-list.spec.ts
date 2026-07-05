import { searchAthletes, sortAthletes } from './athletes-list';
import { AthletesSort } from './athletes-list.enum';
import {
  ATHLETES,
  DENORMALIZED_QUERY,
  EXPECTED_BEST_TIME_ORDER,
  EXPECTED_PARTICIPATIONS_ORDER,
  EXPECTED_SUBSTRING_MATCHES,
  FAST_RUNNER,
  NO_BEST_LATE_NAME,
  NO_MATCH_QUERY,
  SUBSTRING_QUERY,
  TIED_LATE_NAME,
} from './athletes-list.mock';

describe('searchAthletes', () => {
  it('normalizes the query like athlete keys, keeps everything for a blank query and preserves the input order', () => {
    expect(searchAthletes(ATHLETES, '')).toEqual(ATHLETES);
    expect(searchAthletes(ATHLETES, '   '), 'whitespace-only query keeps all records').toEqual(ATHLETES);
    expect(searchAthletes(ATHLETES, DENORMALIZED_QUERY), 'case, padding and ё are normalized away').toEqual([TIED_LATE_NAME]);
    expect(searchAthletes(ATHLETES, SUBSTRING_QUERY)).toEqual(EXPECTED_SUBSTRING_MATCHES);
    expect(searchAthletes(ATHLETES, NO_MATCH_QUERY)).toEqual([]);
  });
});

describe('sortAthletes', () => {
  it('sorts by best time (nulls last) and by participations with name tie-breaks, never mutating the input', () => {
    const input = [...ATHLETES];

    expect(sortAthletes(input, AthletesSort.bestTime)).toEqual(EXPECTED_BEST_TIME_ORDER);
    expect(sortAthletes(input, AthletesSort.participations)).toEqual(EXPECTED_PARTICIPATIONS_ORDER);
    expect(input, 'the input array is left untouched').toEqual(ATHLETES);

    expect(sortAthletes([NO_BEST_LATE_NAME, FAST_RUNNER], AthletesSort.bestTime), 'a missing best sinks below any time').toEqual([
      FAST_RUNNER,
      NO_BEST_LATE_NAME,
    ]);
    expect(sortAthletes([FAST_RUNNER, NO_BEST_LATE_NAME], AthletesSort.bestTime)).toEqual([FAST_RUNNER, NO_BEST_LATE_NAME]);
  });
});
