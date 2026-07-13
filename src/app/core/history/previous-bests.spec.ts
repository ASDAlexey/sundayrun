import { buildPreviousBests } from './previous-bests';
import { EXPECTED_PREVIOUS_BESTS, PREVIOUS_BESTS_EVENT_DATE, PREVIOUS_BESTS_RUNS } from './previous-bests.mock';

describe('previous-bests', () => {
  it('keeps the earliest all-time 5 km best strictly before the event and drops everything else', () => {
    expect(buildPreviousBests(PREVIOUS_BESTS_RUNS, PREVIOUS_BESTS_EVENT_DATE)).toEqual(EXPECTED_PREVIOUS_BESTS);
    expect(buildPreviousBests([], PREVIOUS_BESTS_EVENT_DATE), 'no runs — no previous bests').toEqual({});
  });
});
