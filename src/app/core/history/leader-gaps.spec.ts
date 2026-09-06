import { leaderGapsMs } from './leader-gaps';
import { EXPECTED_LEADER_GAPS, LEADER_GAP_ROWS } from './leader-gaps.mock';

describe('leaderGapsMs', () => {
  it('measures each 5 km finisher against the winner of their gender group', () => {
    expect(leaderGapsMs(LEADER_GAP_ROWS)).toEqual(EXPECTED_LEADER_GAPS);
    expect(leaderGapsMs([]), 'an empty protocol maps to nothing').toEqual([]);
  });
});
