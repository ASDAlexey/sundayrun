import { Gender } from '../models/gender.enum';
import { bestResults, bestResultYears, bestSeasonResults } from './best-results';
import { Season } from './seasons.enum';
import {
  EXPECTED_FEMALE_LEADERBOARD,
  EXPECTED_MALE_LEADERBOARD,
  EXPECTED_MALE_YEAR_LEADERBOARD,
  EXPECTED_YEARS,
  LEADERBOARD_RECORDS,
  LEADERBOARD_YEAR,
} from './best-results.mock';

describe('bestResults', () => {
  it('builds gender leaderboards: fastest first, name tie-break, earliest 5 km record run', () => {
    expect(bestResults(LEADERBOARD_RECORDS, { gender: Gender.male, year: null })).toEqual(EXPECTED_MALE_LEADERBOARD);
    expect(
      bestResults(LEADERBOARD_RECORDS, { gender: Gender.female, year: null }),
      'a DNF-only athlete never reaches the leaderboard',
    ).toEqual(EXPECTED_FEMALE_LEADERBOARD);
    expect(bestResults([], { gender: Gender.male, year: null })).toEqual([]);
  });

  it('narrows the leaderboard to bests set in the given year', () => {
    expect(bestResults(LEADERBOARD_RECORDS, { gender: Gender.male, year: LEADERBOARD_YEAR })).toEqual(EXPECTED_MALE_YEAR_LEADERBOARD);
    expect(
      bestResults(LEADERBOARD_RECORDS, { gender: Gender.female, year: LEADERBOARD_YEAR }),
      'athletes without a best in that year are skipped',
    ).toEqual([]);
  });
});

describe('bestSeasonResults', () => {
  it('narrows the boards to one calendar-year season with the same order, tie-breaks and record dates', () => {
    // Every 2025 run of the fixtures falls in March–May, so the spring board equals the all-time one.
    expect(bestSeasonResults(LEADERBOARD_RECORDS, { gender: Gender.male, year: '2025', season: Season.spring })).toEqual(
      EXPECTED_MALE_LEADERBOARD,
    );
    expect(bestSeasonResults(LEADERBOARD_RECORDS, { gender: Gender.female, year: '2025', season: Season.spring })).toEqual(
      EXPECTED_FEMALE_LEADERBOARD,
    );
    expect(bestSeasonResults(LEADERBOARD_RECORDS, { gender: Gender.male, year: LEADERBOARD_YEAR, season: Season.spring })).toEqual(
      EXPECTED_MALE_YEAR_LEADERBOARD,
    );
    expect(
      bestSeasonResults(LEADERBOARD_RECORDS, { gender: Gender.male, year: '2025', season: Season.summer }),
      'no summer runs — an empty board',
    ).toEqual([]);
  });
});

describe('bestResultYears', () => {
  it('collects the distinct seasons newest first and stays empty without records', () => {
    expect(bestResultYears(LEADERBOARD_RECORDS)).toEqual(EXPECTED_YEARS);
    expect(bestResultYears([])).toEqual([]);
  });
});
