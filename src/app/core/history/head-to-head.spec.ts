import { buildHeadToHead } from './head-to-head';
import {
  EMPTY_HEAD_TO_HEAD,
  EXPECTED_HEAD_TO_HEAD,
  EXPECTED_SWAPPED_HEAD_TO_HEAD,
  LEFT_DUEL_RUNS,
  RIGHT_DUEL_RUNS,
} from './head-to-head.mock';

describe('buildHeadToHead', () => {
  it('pairs shared 5 km races newest-first, scores wins per side and counts draws', () => {
    expect(buildHeadToHead(LEFT_DUEL_RUNS, RIGHT_DUEL_RUNS)).toEqual(EXPECTED_HEAD_TO_HEAD);
    expect(buildHeadToHead(RIGHT_DUEL_RUNS, LEFT_DUEL_RUNS), 'swapping the sides mirrors the score').toEqual(EXPECTED_SWAPPED_HEAD_TO_HEAD);
    expect(buildHeadToHead(LEFT_DUEL_RUNS, []), 'athletes without shared races have the empty duel').toEqual(EMPTY_HEAD_TO_HEAD);
  });
});
