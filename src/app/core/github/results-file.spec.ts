import { buildEventResultsFile, parseEventResultsFile, toEventResults } from './results-file';
import { RESULTS_FILE_SCHEMA_VERSION } from './results-file.constant';
import { EXPECTED_EVENT_RESULTS, INVALID_RESULTS_TEXTS, VALID_RESULTS_TEXT } from './results-file.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from './spec-utils/race-fixtures';

describe('buildEventResultsFile', () => {
  it('wraps the event and rows into the versioned results file', () => {
    expect(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS)).toEqual({
      schemaVersion: RESULTS_FILE_SCHEMA_VERSION,
      event: RACE_EVENT,
      rows: PROTOCOL_ROWS,
    });
  });
});

describe('parseEventResultsFile', () => {
  it('parses a published results file and yields null for null, malformed JSON or an unexpected shape', () => {
    expect(parseEventResultsFile(VALID_RESULTS_TEXT)).toEqual(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));

    for (const text of INVALID_RESULTS_TEXTS) {
      expect(parseEventResultsFile(text), `invalid input: ${text}`).toBeNull();
    }
  });
});

describe('toEventResults', () => {
  it('maps rows to rollup results, keeping DNF rows with a null time and the stub distance', () => {
    expect(toEventResults(PROTOCOL_ROWS)).toEqual(EXPECTED_EVENT_RESULTS);
  });
});
