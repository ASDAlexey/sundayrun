import { parseAthletesHistory } from './history-file';
import { INVALID_HISTORY_TEXTS, VALID_HISTORY, VALID_HISTORY_TEXT } from './history-file.mock';

describe('parseAthletesHistory', () => {
  it('parses a valid history and yields an empty one for null, malformed JSON or a non-object', () => {
    expect(parseAthletesHistory(VALID_HISTORY_TEXT)).toEqual(VALID_HISTORY);

    for (const text of INVALID_HISTORY_TEXTS) {
      expect(parseAthletesHistory(text), `invalid input: ${text}`).toEqual({});
    }
  });
});
