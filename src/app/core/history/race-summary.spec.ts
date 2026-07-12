import { summarizeRace } from './race-summary';
import { EMPTY_RACE_SUMMARY, EXPECTED_RACE_SUMMARY, RACE_SUMMARY_ROWS } from './race-summary.mock';

describe('summarizeRace', () => {
  it('counts finishers, newcomers and personal records from the stored notes', () => {
    expect(summarizeRace(RACE_SUMMARY_ROWS)).toEqual(EXPECTED_RACE_SUMMARY);
    expect(summarizeRace([]), 'an empty protocol yields zero counters').toEqual(EMPTY_RACE_SUMMARY);
  });
});
