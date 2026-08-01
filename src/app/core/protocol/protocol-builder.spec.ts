import { buildProtocolRows } from './protocol-builder';
import {
  EXPECTED_NO_SPLITS_ROW,
  EXPECTED_PROTOCOL_ROWS,
  EXPECTED_TIMED_FINISH_TEXTS,
  EXPECTED_TIMED_LAP_TEXTS,
  NO_SPLITS_PARTICIPANT_NAME,
  PROTOCOL_PARTICIPANTS,
  TIMED_PARTICIPANTS,
} from './protocol-builder.mock';

describe('buildProtocolRows', () => {
  it('orders 5 km finishers with stable per-gender places, then sorted 2.3 km runners and DNF without places', () => {
    expect(buildProtocolRows(PROTOCOL_PARTICIPANTS)).toEqual(EXPECTED_PROTOCOL_ROWS);
  });

  it('gives every participant a row, including a sheet row with a total time but no splits', () => {
    const rows = buildProtocolRows(PROTOCOL_PARTICIPANTS);

    expect(rows.length, 'the two distances plus the leftovers cover the whole roster — /preview pairs rows to participants by index').toBe(
      PROTOCOL_PARTICIPANTS.length,
    );
    expect(
      rows.filter((row) => row.fullName === NO_SPLITS_PARTICIPANT_NAME),
      'a total time with no laps has no distance to be placed at, so it joins the untimed tail in input order, unplaced',
    ).toEqual([EXPECTED_NO_SPLITS_ROW]);
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
