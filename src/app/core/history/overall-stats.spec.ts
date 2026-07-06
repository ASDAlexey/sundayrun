import { computeOverallStats } from './overall-stats';
import { EMPTY_STATS, EXPECTED_STATS, STATS_HISTORY } from './overall-stats.mock';

describe('computeOverallStats', () => {
  it('aggregates events, finishes, finishers and the median times; an empty history yields zeros', () => {
    expect(computeOverallStats(STATS_HISTORY)).toEqual(EXPECTED_STATS);
    expect(computeOverallStats({}), 'zeros instead of NaN when nobody has finished').toEqual(EMPTY_STATS);
  });
});
