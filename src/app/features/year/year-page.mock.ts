import { EXPECTED_EMPTY_YEAR_REVIEW, EXPECTED_YEAR_REVIEW } from '../../core/history/year-review.mock';
import { YearReview } from '../../core/history/year-review.interface';

export const AVAILABLE_YEARS = ['2026', '2025'];

export const REQUESTED_YEAR = '2025';

/** The unknown year the switcher never produced — the page maps it to notFound. */
export const UNKNOWN_YEAR = '1999';

export const YEAR_LOAD_ERROR_MESSAGE = 'year review unavailable';

export const YEAR_REVIEW: YearReview = EXPECTED_YEAR_REVIEW;

/** `YEAR_REVIEW` reshaped for `REQUESTED_YEAR`, so a param-driven load is distinguishable. */
export const REQUESTED_YEAR_REVIEW: YearReview = { ...EXPECTED_YEAR_REVIEW, year: REQUESTED_YEAR };

/** A known year whose review is empty: no medians and no bests, so their cards must disappear. */
export const BESTLESS_YEAR_REVIEW: YearReview = { ...EXPECTED_EMPTY_YEAR_REVIEW, year: AVAILABLE_YEARS[0] };

/** The five always-present counters — what remains of the stats when both medians are unknown. */
export const BESTLESS_STAT_COUNT = 5;
