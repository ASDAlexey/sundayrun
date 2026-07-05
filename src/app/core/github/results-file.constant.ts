export const RESULTS_FILE_SCHEMA_VERSION = 1;

/**
 * Distance stub for DNF rows (`totalMs`/`distanceKm` are null). The rollup never reads the
 * distance of a result without a time, so 0 only keeps `EventResult.distanceKm` non-nullable.
 */
export const DNF_DISTANCE_KM = 0;
