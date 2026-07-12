import { buildYearReview } from './year-review';
import { EMPTY_YEAR_REVIEW_SOURCE, EXPECTED_EMPTY_YEAR_REVIEW, EXPECTED_YEAR_REVIEW, YEAR_REVIEW_SOURCE } from './year-review.mock';

describe('buildYearReview', () => {
  it('derives the totals, gendered medians and bests, activity board and badge holders from one year of runs', () => {
    expect(buildYearReview(YEAR_REVIEW_SOURCE)).toEqual(EXPECTED_YEAR_REVIEW);
  });

  it('collapses a raceless year to the empty review: null medians and bests, empty boards', () => {
    expect(buildYearReview(EMPTY_YEAR_REVIEW_SOURCE)).toEqual(EXPECTED_EMPTY_YEAR_REVIEW);
  });
});
