import { suggestAthletes } from './athlete-suggest';
import {
  EXPECTED_SUGGESTED,
  EXPECTED_SUGGESTED_LIMITED,
  EXPECTED_SUGGESTED_WITHOUT_EXCLUDED,
  SUGGEST_EXCLUDED_KEY,
  SUGGEST_OPTIONS,
  SUGGEST_QUERY,
} from './athlete-suggest.mock';

describe('suggestAthletes', () => {
  it('normalizes the query, drops excluded keys, sorts by display name and honours the limit', () => {
    expect(suggestAthletes(SUGGEST_OPTIONS, '', [], SUGGEST_OPTIONS.length), 'an empty query suggests nothing').toEqual([]);
    expect(suggestAthletes(SUGGEST_OPTIONS, '   ', [], SUGGEST_OPTIONS.length), 'whitespace normalizes to empty').toEqual([]);
    expect(suggestAthletes(SUGGEST_OPTIONS, SUGGEST_QUERY, [], SUGGEST_OPTIONS.length)).toEqual(EXPECTED_SUGGESTED);
    expect(suggestAthletes(SUGGEST_OPTIONS, SUGGEST_QUERY, [SUGGEST_EXCLUDED_KEY, undefined], SUGGEST_OPTIONS.length)).toEqual(
      EXPECTED_SUGGESTED_WITHOUT_EXCLUDED,
    );
    expect(suggestAthletes(SUGGEST_OPTIONS, SUGGEST_QUERY, [], EXPECTED_SUGGESTED_LIMITED.length)).toEqual(EXPECTED_SUGGESTED_LIMITED);
  });
});
