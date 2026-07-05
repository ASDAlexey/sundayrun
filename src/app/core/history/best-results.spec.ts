import { Gender } from '../models/gender.enum';
import { topBestResults } from './best-results';
import { EXPECTED_FEMALE_LEADERBOARD, EXPECTED_MALE_LEADERBOARD, LEADERBOARD_LIMIT, LEADERBOARD_RECORDS } from './best-results.mock';

describe('topBestResults', () => {
  it('builds gender leaderboards: fastest first, name tie-break, earliest 5 km record run, limit applied', () => {
    expect(topBestResults(LEADERBOARD_RECORDS, Gender.male, LEADERBOARD_LIMIT)).toEqual(EXPECTED_MALE_LEADERBOARD);
    expect(
      topBestResults(LEADERBOARD_RECORDS, Gender.female, LEADERBOARD_LIMIT),
      'a DNF-only athlete never reaches the leaderboard',
    ).toEqual(EXPECTED_FEMALE_LEADERBOARD);
    expect(topBestResults([], Gender.male, LEADERBOARD_LIMIT)).toEqual([]);
  });
});
