import { finishCountsWithDrafts, previousBestsWithDrafts } from './draft-priors';
import {
  EARLIER_DRAFTS,
  EXPECTED_DRAFT_FINISH_COUNTS,
  EXPECTED_DRAFT_PREVIOUS_BESTS,
  PRIOR_DRAFT_FINISH_COUNTS,
  PRIOR_DRAFT_PREVIOUS_BESTS,
} from './draft-priors.mock';

describe('finishCountsWithDrafts', () => {
  it("adds the earlier drafts' 5 km finishes onto the stored counts, keyed by the normalized name; short course and DNF stay out", () => {
    expect(finishCountsWithDrafts(PRIOR_DRAFT_FINISH_COUNTS, EARLIER_DRAFTS)).toEqual(EXPECTED_DRAFT_FINISH_COUNTS);
    expect(finishCountsWithDrafts(PRIOR_DRAFT_FINISH_COUNTS, []), 'no earlier drafts keep the stored counts').toEqual(
      PRIOR_DRAFT_FINISH_COUNTS,
    );
  });
});

describe('previousBestsWithDrafts', () => {
  it('keeps a faster stored best, replaces it when a draft run beats it and creates entries for draft-only athletes', () => {
    expect(previousBestsWithDrafts(PRIOR_DRAFT_PREVIOUS_BESTS, EARLIER_DRAFTS)).toEqual(EXPECTED_DRAFT_PREVIOUS_BESTS);
    expect(previousBestsWithDrafts(PRIOR_DRAFT_PREVIOUS_BESTS, []), 'no earlier drafts keep the stored bests').toEqual(
      PRIOR_DRAFT_PREVIOUS_BESTS,
    );
  });
});
