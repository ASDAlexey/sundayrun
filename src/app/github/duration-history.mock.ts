/** Recorded click-to-live timings driving the average: 2:00 and 3:00 → 2:30. */
export const DURATION_HISTORY_MOCK = [120_000, 180_000];

export const DURATION_HISTORY_AVERAGE_MOCK = 150_000;

/** A pre-existing stored history the reader must survive alongside garbage entries. */
export const DURATION_HISTORY_STORED_RAW = JSON.stringify([120_000, 'garbage', -5, 180_000]);

export const DURATION_HISTORY_MALFORMED_RAW = '{not json';

/** Any key does for the shared factory: it only echoes the one it was handed back to storage. */
export const DURATION_HISTORY_KEY_MOCK = 'parkrun.spec-durations';
