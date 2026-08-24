import { closeRivals } from './rivals';
import { EXPECTED_RIVALS, EXPECTED_YEAR_RIVALS, RIVAL_ATHLETE_KEY, RIVAL_ROWS, RIVAL_SCAN_YEAR } from './rivals.mock';

describe('closeRivals', () => {
  it('ranks close finishers by count then gap, honours the minimum, the limit and the year filter', () => {
    expect(closeRivals(RIVAL_ROWS, { athleteKey: RIVAL_ATHLETE_KEY, year: null })).toEqual(EXPECTED_RIVALS);
    expect(closeRivals(RIVAL_ROWS, { athleteKey: RIVAL_ATHLETE_KEY, year: RIVAL_SCAN_YEAR }), 'the year filter rescans one season').toEqual(
      EXPECTED_YEAR_RIVALS,
    );
    expect(closeRivals(RIVAL_ROWS, { athleteKey: 'разовый родион', year: null }), 'a lone close finish never makes a rival').toEqual([]);
    expect(closeRivals([], { athleteKey: RIVAL_ATHLETE_KEY, year: null }), 'no rows — no rivals').toEqual([]);
  });
});
