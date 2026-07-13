import { bestFirstLap, firstLapRecords } from './first-lap';
import { EMPTY_FIRST_LAP_RECORDS } from './first-lap.constant';
import { ATHLETE_FIRST_LAPS, EXPECTED_BEST_FIRST_LAP, EXPECTED_FIRST_LAP_RECORDS, FIRST_LAP_RUNS } from './first-lap.mock';

describe('first-lap', () => {
  it('keeps the fastest split per gender with the first setter on a tie, and picks an athlete’s own best', () => {
    expect(firstLapRecords(FIRST_LAP_RUNS)).toEqual(EXPECTED_FIRST_LAP_RECORDS);
    expect(firstLapRecords([]), 'no splits leave both boards vacant').toEqual(EMPTY_FIRST_LAP_RECORDS);
    expect(bestFirstLap(ATHLETE_FIRST_LAPS), 'the equal split stays with the earlier run').toEqual(EXPECTED_BEST_FIRST_LAP);
    expect(bestFirstLap([]), 'no recorded splits yield no best lap').toBeNull();
  });
});
