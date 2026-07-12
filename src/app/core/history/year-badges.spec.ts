import { athleteYearBadges, yearBadgesOf } from './year-badges';
import { EXPECTED_MULTI_YEAR_BADGES, FIRST_EVENT_DATE_BY_YEAR, MULTI_YEAR_RUNS, YEAR_ACTIVITY_CASES } from './year-badges.mock';

describe('yearBadgesOf', () => {
  it('awards the highest obsessive tier, the all-months and the new-year badges by the year activity', () => {
    for (const [label, activity, expected] of YEAR_ACTIVITY_CASES) {
      expect(yearBadgesOf(activity), label).toEqual(expected);
    }
  });
});

describe('athleteYearBadges', () => {
  it('groups the runs by year, awards per-year badges newest first and omits badge-less years', () => {
    expect(athleteYearBadges(MULTI_YEAR_RUNS, FIRST_EVENT_DATE_BY_YEAR)).toEqual(EXPECTED_MULTI_YEAR_BADGES);
    expect(athleteYearBadges([], FIRST_EVENT_DATE_BY_YEAR), 'no runs — no badges').toEqual([]);
  });
});
