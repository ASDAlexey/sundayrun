import { buildPreviousBests } from './previous-bests';
import {
  EXPECTED_PREVIOUS_BESTS,
  EXPECTED_YEAR_PREVIOUS_BESTS,
  PREVIOUS_BESTS_EVENT_DATE,
  PREVIOUS_BESTS_LAST_YEAR_RUNS,
  PREVIOUS_BESTS_RUNS,
  PREVIOUS_BESTS_YEAR_START,
} from './previous-bests.mock';

describe('previous-bests', () => {
  it('keeps the earliest all-time 5 km best strictly before the event and drops everything else', () => {
    expect(buildPreviousBests(PREVIOUS_BESTS_RUNS, PREVIOUS_BESTS_EVENT_DATE)).toEqual(EXPECTED_PREVIOUS_BESTS);
    expect(buildPreviousBests([], PREVIOUS_BESTS_EVENT_DATE), 'no runs — no previous bests').toEqual({});
  });

  it('bounds the scan to the year when asked, so last season’s record cannot answer for this one', () => {
    expect(buildPreviousBests(PREVIOUS_BESTS_LAST_YEAR_RUNS, PREVIOUS_BESTS_EVENT_DATE, PREVIOUS_BESTS_YEAR_START)).toEqual(
      EXPECTED_YEAR_PREVIOUS_BESTS,
    );
    expect(
      buildPreviousBests(PREVIOUS_BESTS_LAST_YEAR_RUNS, PREVIOUS_BESTS_EVENT_DATE)['попов алексей'],
      'unbounded, the 2024 record wins',
    ).toEqual({ slug: '2024-11-10', dateIso: '2024-11-10', timeMs: 1100000 });
  });
});
