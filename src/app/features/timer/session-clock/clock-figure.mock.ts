/** Elapsed milliseconds, the instrument figure they spell out, and the hundredths beside it. */
export interface ClockFigureCase {
  ms: number;
  text: string;
  fraction: string;
}

/**
 * The moments that decide the shape of the readout: a race that has not started, an ordinary lap
 * time, the last second before the hour, the hour itself, which is where the field appears — and a
 * millisecond that must not round the hundredth up, because a clock ahead of the race is a lie.
 */
export const CLOCK_FIGURE_CASES: readonly ClockFigureCase[] = [
  { ms: 0, text: '00:00', fraction: ',00' },
  { ms: 1_009, text: '00:01', fraction: ',00' },
  { ms: 767_300, text: '12:47', fraction: ',30' },
  { ms: 3_599_900, text: '59:59', fraction: ',90' },
  { ms: 3_600_000, text: '1:00:00', fraction: ',00' },
  { ms: 3_661_500, text: '1:01:01', fraction: ',50' },
];
