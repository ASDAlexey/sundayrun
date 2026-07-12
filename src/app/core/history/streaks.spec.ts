import { athleteStreaks } from './streaks';
import { PARTICIPATION_STREAK_CASES, RAGE_CASES, STREAK_EVENT_SLUGS } from './streaks.mock';

describe('athleteStreaks', () => {
  it('counts the current and the longest run of consecutive events over the chronology', () => {
    for (const [label, participationSlugs, currentWeeks, maxWeeks] of PARTICIPATION_STREAK_CASES) {
      expect(athleteStreaks(participationSlugs, [], STREAK_EVENT_SLUGS), label).toEqual({ currentWeeks, maxWeeks, rageCount: 0 });
    }

    expect(athleteStreaks(['2026-05-03'], [], []), 'an empty archive yields no streaks').toEqual({
      currentWeeks: 0,
      maxWeeks: 0,
      rageCount: 0,
    });
  });

  it('earns «Раж» for every completed triple of consecutive 5 km personal records', () => {
    for (const [label, runs, rageCount] of RAGE_CASES) {
      expect(athleteStreaks([], runs, []), label).toEqual({ currentWeeks: 0, maxWeeks: 0, rageCount });
    }
  });
});
