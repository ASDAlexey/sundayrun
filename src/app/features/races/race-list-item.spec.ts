import { EXPECTED_NEW_ENTRY, EXPECTED_NO_FINISHER_ENTRY } from '../../core/github/archive-index.mock';
import { toRaceListItems } from './race-list-item';
import {
  DECLINE_ENTRIES,
  EDGE_CASES_TODAY_ISO,
  EXPECTED_DECLINE_TREND,
  EXPECTED_FEMALE_ONLY_GENDERS,
  EXPECTED_NOTELESS_HERO,
  EXPECTED_RECORDLESS_HERO,
  NOTELESS_ENTRY,
} from './race-list-item.mock';

describe('race-list-item', () => {
  it('builds a never-celebrating flat chart for zero finishers and dimmed zeros for note-less counts', () => {
    const [recordless] = toRaceListItems([EXPECTED_NO_FINISHER_ENTRY], EDGE_CASES_TODAY_ISO);

    expect(recordless.hero, 'zero finishers keep the chart flat and the caption plain').toEqual(EXPECTED_RECORDLESS_HERO);

    const [noteless] = toRaceListItems([NOTELESS_ENTRY], EDGE_CASES_TODAY_ISO);

    expect(noteless.hero, 'null note counts fall back to dimmed zeros instead of hiding the rows').toEqual(EXPECTED_NOTELESS_HERO);
    expect(noteless.genders, 'note-less aggregates also carry no times').toEqual([]);

    const [decline] = toRaceListItems(DECLINE_ENTRIES, EDGE_CASES_TODAY_ISO);

    expect(decline.hero.trend, 'a quieter week charts below the window maximum without celebrating').toEqual(EXPECTED_DECLINE_TREND);

    const [femaleOnly] = toRaceListItems([EXPECTED_NEW_ENTRY], EDGE_CASES_TODAY_ISO);

    expect(femaleOnly.genders, 'a gender with no qualifying finisher drops its column entirely').toEqual(EXPECTED_FEMALE_ONLY_GENDERS);
  });
});
