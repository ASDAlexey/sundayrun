import { memeStandings } from './meme-thresholds';
import { MEME_THRESHOLDS } from './meme-thresholds.constant';
import {
  EXPECTED_EQUAL_STANDINGS,
  EXPECTED_MID_STANDINGS,
  MEME_EQUAL_BEST_MS,
  MEME_MID_BEST_MS,
  MEME_TEST_THRESHOLDS,
} from './meme-thresholds.mock';

describe('meme-thresholds', () => {
  it('sorts the ladder fastest first, beats only strictly slower benchmarks and targets the slowest unbeaten one', () => {
    expect(memeStandings(MEME_TEST_THRESHOLDS, MEME_MID_BEST_MS)).toEqual(EXPECTED_MID_STANDINGS);
    expect(memeStandings(MEME_TEST_THRESHOLDS, MEME_EQUAL_BEST_MS), 'an equal time never beats the benchmark').toEqual(
      EXPECTED_EQUAL_STANDINGS,
    );
    expect(memeStandings([], MEME_MID_BEST_MS), 'no benchmarks make no ladder').toEqual([]);
    // The shipped ladder must keep every flag unambiguous: unique keys, strictly ascending times.
    expect(new Set(MEME_THRESHOLDS.map((threshold) => threshold.key)).size).toBe(MEME_THRESHOLDS.length);
    expect(MEME_THRESHOLDS.every((threshold, index) => index === 0 || MEME_THRESHOLDS[index - 1].timeMs < threshold.timeMs)).toBe(true);
  });
});
