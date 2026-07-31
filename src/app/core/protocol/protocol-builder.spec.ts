import { buildProtocolRows } from './protocol-builder';
import {
  EXPECTED_PROTOCOL_ROWS,
  EXPECTED_TIMED_FINISH_TEXTS,
  EXPECTED_TIMED_LAP_TEXTS,
  PROTOCOL_PARTICIPANTS,
  TIMED_PARTICIPANTS,
} from './protocol-builder.mock';

describe('buildProtocolRows', () => {
  it('orders 5 km finishers with stable per-gender places, then sorted 2.3 km runners and DNF without places', () => {
    expect(buildProtocolRows(PROTOCOL_PARTICIPANTS)).toEqual(EXPECTED_PROTOCOL_ROWS);
  });

  it('draws the 2.3 km column with hundredths only when the event was timed finer than a second', () => {
    const timed = buildProtocolRows(TIMED_PARTICIPANTS);

    expect(
      timed.map((row) => row.time23),
      'a stopwatch session keeps its splits',
    ).toEqual(EXPECTED_TIMED_LAP_TEXTS);
    expect(timed.map((row) => row.time5)).toEqual(EXPECTED_TIMED_FINISH_TEXTS);
    expect(
      buildProtocolRows(PROTOCOL_PARTICIPANTS).every((row) => !row.time23.includes(',')),
      'a whole-second event has no fraction to show, so the column drops it',
    ).toBe(true);
  });
});
