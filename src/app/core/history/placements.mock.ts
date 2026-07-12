import { AthletePlacements } from './placements.interface';

const FINAL_SLUGS = ['2026-01-25', '2026-02-22'];

const NO_PLACEMENTS: AthletePlacements = {
  bestFinalPlace: null,
  bestRegularPlace: null,
  firstFinalCount: 0,
  secondFinalCount: 0,
  thirdFinalCount: 0,
};

/** [label, place by slug, final slugs, the expected split]. */
export const PLACEMENT_CASES: readonly [string, Record<string, number>, string[], AthletePlacements][] = [
  ['no places yield an empty split', {}, FINAL_SLUGS, NO_PLACEMENTS],
  [
    'places split between finals and regular races, podium steps tallied',
    { '2026-01-11': 4, '2026-01-25': 1, '2026-02-01': 2, '2026-02-22': 3, '2026-03-01': 5 },
    FINAL_SLUGS,
    { bestFinalPlace: 1, bestRegularPlace: 2, firstFinalCount: 1, secondFinalCount: 0, thirdFinalCount: 1 },
  ],
  [
    'repeated podium steps accumulate and the best final place wins',
    { '2026-01-25': 2, '2026-02-22': 2 },
    FINAL_SLUGS,
    { bestFinalPlace: 2, bestRegularPlace: null, firstFinalCount: 0, secondFinalCount: 2, thirdFinalCount: 0 },
  ],
  [
    'a final place off the podium still counts as the best final one',
    { '2026-01-25': 7, '2026-02-01': 9 },
    FINAL_SLUGS,
    { bestFinalPlace: 7, bestRegularPlace: 9, firstFinalCount: 0, secondFinalCount: 0, thirdFinalCount: 0 },
  ],
];
