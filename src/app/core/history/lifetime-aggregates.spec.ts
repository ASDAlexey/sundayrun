import { lifetimeAggregates } from './lifetime-aggregates';
import {
  EMPTY_LIFETIME_AGGREGATES,
  EXPECTED_LIFETIME_AGGREGATES,
  EXPECTED_SHORT_ONLY_AGGREGATES,
  LIFETIME_RUNS,
  SHORT_ONLY_RUNS,
} from './lifetime-aggregates.mock';

describe('lifetime-aggregates', () => {
  it('sums lifetime time and kilometres, buckets 5 km results with zero gaps and averages the pace per year', () => {
    expect(lifetimeAggregates([...LIFETIME_RUNS])).toEqual(EXPECTED_LIFETIME_AGGREGATES);
    expect(lifetimeAggregates([...SHORT_ONLY_RUNS]), 'the short course counts in the totals only').toEqual(EXPECTED_SHORT_ONLY_AGGREGATES);
    expect(lifetimeAggregates([]), 'no finishes make empty aggregates').toEqual(EMPTY_LIFETIME_AGGREGATES);
  });
});
