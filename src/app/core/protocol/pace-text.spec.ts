import { paceTextOf } from './pace-text';
import { PACE_TEXT_CASES } from './pace-text.mock';

describe('pace-text', () => {
  it('formats the average pace per km and leaves DNF rows blank', () => {
    for (const [totalMs, distanceKm, expected] of PACE_TEXT_CASES) {
      expect(paceTextOf(totalMs, distanceKm), `paceTextOf(${totalMs}, ${distanceKm})`).toBe(expected);
    }
  });
});
