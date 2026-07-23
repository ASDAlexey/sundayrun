/**
 * The one time statistic every surface shows: a median instead of a mean, so a handful of
 * walkers or one recovering runner cannot drag the "typical" 5 km time of a small field.
 * An even-sized sample takes the mean of the two middle values, rounded to whole ms.
 */
export function medianMs(timesMs: readonly number[]): number {
  if (timesMs.length === 0) {
    return 0;
  }

  const sorted = [...timesMs].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/** The nullable flavour for per-event stats, where "nobody finished 5 km" must stay a gap, not 0:00. */
export function medianMsOrNull(timesMs: readonly number[]): number | null {
  return timesMs.length === 0 ? null : medianMs(timesMs);
}

/**
 * The unrounded flavour for ratios (the pacing indexes), where whole-ms rounding would erase the
 * signal. Expects a non-empty sample — every caller gates on a minimum run count first.
 */
export function medianRatio(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
