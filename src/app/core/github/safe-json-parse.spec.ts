import { safeJsonParse } from './safe-json-parse';
import { MALFORMED_JSON_TEXT, PARSED_VALID_JSON, VALID_JSON_TEXT } from './safe-json-parse.mock';

describe('safeJsonParse', () => {
  it('parses valid JSON and yields null for null input or malformed JSON', () => {
    expect(safeJsonParse(VALID_JSON_TEXT)).toEqual(PARSED_VALID_JSON);
    expect(safeJsonParse(null)).toBeNull();
    expect(safeJsonParse(MALFORMED_JSON_TEXT)).toBeNull();
  });
});
