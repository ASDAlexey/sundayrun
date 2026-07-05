import { normalizeAthleteKey } from './athlete-key';
import { ATHLETE_KEY_CASES } from './athlete-key.mock';

describe('normalizeAthleteKey', () => {
  it('trims, collapses inner whitespace, lowercases and replaces ё with е', () => {
    for (const [raw, expected] of ATHLETE_KEY_CASES) {
      expect(normalizeAthleteKey(raw), `normalizeAthleteKey(${JSON.stringify(raw)})`).toBe(expected);
    }
  });
});
