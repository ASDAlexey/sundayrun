/** [totalMs, distanceKm, expected pace text]. */
export const PACE_TEXT_CASES: readonly (readonly [number | null, number | null, string])[] = [
  // 20:59 over 5 km → 4:11,80 min/km — the pace keeps the hundredths the division lands on
  [1_259_000, 5, '4:11,80'],
  // 9:26 over 2.3 km → 4:06,09 min/km
  [566_000, 2.3, '4:06,09'],
  // DNF or unknown distance stays blank
  [null, 5, ''],
  [1_259_000, null, ''],
  [null, null, ''],
];
