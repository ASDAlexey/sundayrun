import { distinctRunYears, filterRuns, sortRuns, yearBestEntries } from './athlete-runs';
import { RunsSort } from './athlete-runs.enum';
import {
  ATHLETE_RUNS,
  BEST_MS_BY_YEAR,
  EXPECTED_BOTH_FILTERED,
  EXPECTED_BY_DATE_ORDER,
  EXPECTED_BY_TIME_ORDER,
  EXPECTED_DISTANCE_FILTERED,
  EXPECTED_RUN_YEARS,
  EXPECTED_YEAR_BESTS,
  EXPECTED_YEAR_FILTERED,
  FILTER_YEAR,
} from './athlete-runs.mock';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';

describe('distinctRunYears', () => {
  it('deduplicates the run years and sorts them newest first', () => {
    expect(distinctRunYears(ATHLETE_RUNS)).toEqual(EXPECTED_RUN_YEARS);
    expect(distinctRunYears([])).toEqual([]);
  });
});

describe('filterRuns', () => {
  it('filters by year and distance independently and combined; null filters keep everything', () => {
    expect(filterRuns(ATHLETE_RUNS, null, null)).toEqual(ATHLETE_RUNS);
    expect(filterRuns(ATHLETE_RUNS, FILTER_YEAR, null)).toEqual(EXPECTED_YEAR_FILTERED);
    expect(filterRuns(ATHLETE_RUNS, null, FIVE_KM_DISTANCE_KM)).toEqual(EXPECTED_DISTANCE_FILTERED);
    expect(filterRuns(ATHLETE_RUNS, FILTER_YEAR, TWO_THREE_KM_DISTANCE_KM)).toEqual(EXPECTED_BOTH_FILTERED);
  });
});

describe('sortRuns', () => {
  it('sorts newest first by date and fastest first by time, never mutating the input', () => {
    const input = [...ATHLETE_RUNS];

    expect(sortRuns(input, RunsSort.byDate)).toEqual(EXPECTED_BY_DATE_ORDER);
    expect(sortRuns(input, RunsSort.byTime)).toEqual(EXPECTED_BY_TIME_ORDER);
    expect(input, 'the input array is left untouched').toEqual(ATHLETE_RUNS);
  });
});

describe('yearBestEntries', () => {
  it('flattens the year bests into entries sorted newest year first; missing runs get empty slug', () => {
    expect(yearBestEntries(BEST_MS_BY_YEAR, ATHLETE_RUNS)).toEqual(EXPECTED_YEAR_BESTS);
    expect(yearBestEntries({})).toEqual([]);
    expect(yearBestEntries(BEST_MS_BY_YEAR)).toEqual([
      { year: '2026', timeMs: 1440000, slug: '' },
      { year: '2025', timeMs: 1500000, slug: '' },
    ]);
  });
});
