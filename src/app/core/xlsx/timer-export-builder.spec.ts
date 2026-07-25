import { Participant } from '../models/participant.interface';
import { buildTimerExportRows } from './timer-export-builder';
import { TIMER_EXPORT_HEADER_ROW } from './timer-export-builder.constant';
import { EXPECTED_EXPORT_ROWS, EXPORT_PARTICIPANTS, LONG_ROSTER_PARTICIPANTS, LONG_ROSTER_SIZE } from './timer-export-builder.mock';
import { parseTimerExport } from './timer-export-parser';
import { readXlsxRows } from './xlsx-reader';
import { writeXlsxRows } from './xlsx-writer';

/** The full export path a guest takes: build rows, save the file, hand it to `/upload`. */
function roundTrip(participants: Participant[]): Participant[] {
  return parseTimerExport(readXlsxRows(writeXlsxRows(buildTimerExportRows(participants))));
}

describe('timer-export-builder', () => {
  it('builds the timer table: header, finisher averages, single-lap runner, DNF, missing lap split, no participants', () => {
    expect(buildTimerExportRows(EXPORT_PARTICIPANTS)).toEqual(EXPECTED_EXPORT_ROWS);
    expect(buildTimerExportRows([])).toEqual([[...TIMER_EXPORT_HEADER_ROW]]);
  });

  it('round-trips through xlsx: build, write, read and parse return the very same participants', () => {
    expect(roundTrip(EXPORT_PARTICIPANTS)).toEqual(EXPORT_PARTICIPANTS);
    expect(roundTrip(LONG_ROSTER_PARTICIPANTS)).toEqual(LONG_ROSTER_PARTICIPANTS);
    expect(roundTrip(LONG_ROSTER_PARTICIPANTS)).toHaveLength(LONG_ROSTER_SIZE);
  });
});
