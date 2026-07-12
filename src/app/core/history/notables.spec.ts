import { buildEventNotables } from './notables';
import { EXPECTED_EVENT_NOTABLES, NOTABLE_EVENT_DATE, NOTABLE_EVENT_RUNS, NOTABLE_EVENT_SLUG } from './notables.mock';

describe('buildEventNotables', () => {
  it('ranks career results, spots window bests and stays silent for records, short histories and thin windows', () => {
    expect(buildEventNotables(NOTABLE_EVENT_RUNS, NOTABLE_EVENT_SLUG, NOTABLE_EVENT_DATE)).toEqual(EXPECTED_EVENT_NOTABLES);
    expect(buildEventNotables([], NOTABLE_EVENT_SLUG, NOTABLE_EVENT_DATE), 'no runs mean no notables').toEqual({});
  });
});
