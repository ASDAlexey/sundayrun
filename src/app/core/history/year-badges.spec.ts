import { athleteYearActivity, athleteYearBadges, yearBadgesOf } from './year-badges';
import {
  EMPTY_YEAR_ACTIVITY,
  EXPECTED_2025_ACTIVITY,
  EXPECTED_MULTI_YEAR_BADGES,
  EXPECTED_RANKED_MULTI_YEAR_BADGES,
  FIRST_EVENT_DATE_BY_YEAR,
  MULTI_YEAR_RUNS,
  RANK_BADGES_BY_YEAR,
  YEAR_ACTIVITY_CASES,
} from './year-badges.mock';

describe('yearBadgesOf', () => {
  it('awards the highest obsessive tier, the all-months, new-year, comeback and slow-participation badges by the year activity', () => {
    for (const [label, activity, expected] of YEAR_ACTIVITY_CASES) {
      expect(yearBadgesOf(activity), label).toEqual(expected);
    }
  });
});

describe('athleteYearBadges', () => {
  it('groups the runs by year, awards per-year badges newest first and omits badge-less years', () => {
    expect(athleteYearBadges(MULTI_YEAR_RUNS, FIRST_EVENT_DATE_BY_YEAR)).toEqual(EXPECTED_MULTI_YEAR_BADGES);
    expect(athleteYearBadges([], FIRST_EVENT_DATE_BY_YEAR), 'no runs — no badges').toEqual([]);
    expect(
      athleteYearBadges(MULTI_YEAR_RUNS, FIRST_EVENT_DATE_BY_YEAR, RANK_BADGES_BY_YEAR),
      'rank badges lead their years and revive a badge-less one',
    ).toEqual(EXPECTED_RANKED_MULTI_YEAR_BADGES);
  });
});

describe('athleteYearActivity', () => {
  it('slices one year of the runs into the badge activity', () => {
    expect(athleteYearActivity(MULTI_YEAR_RUNS, '2025', FIRST_EVENT_DATE_BY_YEAR['2025'])).toEqual(EXPECTED_2025_ACTIVITY);
    expect(athleteYearActivity(MULTI_YEAR_RUNS, '2020', FIRST_EVENT_DATE_BY_YEAR['2020']), 'a year never ran is all zeroes').toEqual(
      EMPTY_YEAR_ACTIVITY,
    );
  });
});
