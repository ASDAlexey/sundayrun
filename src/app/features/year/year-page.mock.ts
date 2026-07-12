import { EXPECTED_YEAR_REVIEW } from '../../core/history/year-review.mock';
import { YearReview } from '../../core/history/year-review.interface';

export const AVAILABLE_YEARS = ['2026', '2025'];

export const REQUESTED_YEAR = '2025';

/** The unknown year the switcher never produced — the page maps it to notFound. */
export const UNKNOWN_YEAR = '1999';

export const YEAR_LOAD_ERROR_MESSAGE = 'year review unavailable';

export const YEAR_REVIEW: YearReview = EXPECTED_YEAR_REVIEW;

/** `YEAR_REVIEW` reshaped for `REQUESTED_YEAR`, so a param-driven load is distinguishable. */
export const REQUESTED_YEAR_REVIEW: YearReview = { ...EXPECTED_YEAR_REVIEW, year: REQUESTED_YEAR };
