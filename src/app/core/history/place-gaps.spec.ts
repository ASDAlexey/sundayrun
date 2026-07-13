import { placeGapsMs } from './place-gaps';
import { EXPECTED_PLACE_GAPS, PLACE_GAP_ROWS } from './place-gaps.mock';

describe('placeGapsMs', () => {
  it('measures each 5 km finisher against the next place up in their gender group', () => {
    expect(placeGapsMs(PLACE_GAP_ROWS)).toEqual(EXPECTED_PLACE_GAPS);
    expect(placeGapsMs([]), 'an empty protocol maps to nothing').toEqual([]);
  });
});
