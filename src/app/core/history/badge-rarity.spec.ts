import { yearBadgeRarity } from './badge-rarity';
import { EXPECTED_RARITY, RARITY_FIRST_EVENT_DATE_BY_YEAR, RARITY_PARTICIPANT_COUNT, RARITY_ROWS } from './badge-rarity.mock';
import { YearBadge } from './year-badges.enum';

const HUGE_PARTICIPANT_COUNT = 1000;

describe('yearBadgeRarity', () => {
  it('counts each holder once across years, rounds to whole percents and never rounds an owned badge to 0%', () => {
    expect(yearBadgeRarity(RARITY_ROWS, RARITY_FIRST_EVENT_DATE_BY_YEAR, RARITY_PARTICIPANT_COUNT)).toEqual(EXPECTED_RARITY);
    expect(
      yearBadgeRarity(RARITY_ROWS, RARITY_FIRST_EVENT_DATE_BY_YEAR, HUGE_PARTICIPANT_COUNT)[YearBadge.obsessiveGold],
      '2 of 1000 clamps to 1%',
    ).toBe(1);
    expect(yearBadgeRarity(RARITY_ROWS, RARITY_FIRST_EVENT_DATE_BY_YEAR, 0), 'no participants — no rarity').toEqual({});
    expect(yearBadgeRarity([], RARITY_FIRST_EVENT_DATE_BY_YEAR, RARITY_PARTICIPANT_COUNT), 'no activity — no rarity').toEqual({});
  });
});
