import { athletePlacements } from './placements';
import { PLACEMENT_CASES } from './placements.mock';

describe('athletePlacements', () => {
  it('splits the best place by race kind and tallies the podium steps taken at finals', () => {
    for (const [label, placeBySlug, finalSlugs, expected] of PLACEMENT_CASES) {
      expect(athletePlacements(placeBySlug, new Set(finalSlugs)), label).toEqual(expected);
    }
  });
});
