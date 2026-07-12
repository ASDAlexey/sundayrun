import { eventFinishCounts, finishCountsAt } from './finish-counts';
import {
  EXPECTED_EVENT_FINISH_COUNTS,
  EXPECTED_FINISH_COUNTS_AT,
  FINISH_COUNT_EVENT_DATE,
  FINISH_COUNT_ROWS,
  FINISH_COUNT_RUNS,
  PRIOR_FINISH_COUNTS,
} from './finish-counts.mock';

describe('finishCountsAt', () => {
  it('counts the 5 km finishes up to the event date, ignoring future and short-course runs', () => {
    expect(finishCountsAt(FINISH_COUNT_RUNS, FINISH_COUNT_EVENT_DATE)).toEqual(EXPECTED_FINISH_COUNTS_AT);
    expect(finishCountsAt([], FINISH_COUNT_EVENT_DATE), 'no runs mean no counts').toEqual({});
  });
});

describe('eventFinishCounts', () => {
  it('adds this finish to the stored prior counts, keyed by the normalized name; short course and DNF stay out', () => {
    expect(eventFinishCounts(FINISH_COUNT_ROWS, PRIOR_FINISH_COUNTS)).toEqual(EXPECTED_EVENT_FINISH_COUNTS);
    expect(eventFinishCounts([], PRIOR_FINISH_COUNTS), 'no rows mean no counts').toEqual({});
  });
});
