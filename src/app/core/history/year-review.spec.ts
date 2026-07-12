import { buildYearReview } from './year-review';
import { EXPECTED_YEAR_REVIEW, YEAR_REVIEW_SOURCE } from './year-review.mock';

describe('buildYearReview', () => {
  it('derives the totals, gendered medians and bests, activity board and badge holders from one year of runs', () => {
    expect(buildYearReview(YEAR_REVIEW_SOURCE)).toEqual(EXPECTED_YEAR_REVIEW);
  });
});
