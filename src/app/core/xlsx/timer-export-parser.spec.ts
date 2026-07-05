import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Participant } from '../models/participant.interface';
import { parseTimerExport } from './timer-export-parser';
import { TIMER_EXPORT_NOTE_PREFIX } from './timer-export-parser.constant';
import {
  EXPECTED_FIRST_PARTICIPANT_14,
  EXPECTED_KOVSHOVA_PARTICIPANT,
  EXPECTED_PARTICIPANT_COUNT_14,
  EXPECTED_PARTICIPANT_COUNT_24,
  EXPECTED_SYNTHETIC_PARTICIPANTS,
  EXPECTED_TRAILING_PARTICIPANTS,
  HEADERLESS_ROWS,
  KOVSHOVA_INDEX,
  LAST_PARTICIPANT_NAME_24,
  SYNTHETIC_EXPORT_ROWS,
  TRAILING_DATA_ROWS,
} from './timer-export-parser.mock';
import { readXlsxRows } from './xlsx-reader';
import { FIXTURE_14_FILE_NAME, FIXTURE_24_FILE_NAME, FIXTURES_DIR_FROM_ROOT } from './xlsx-reader.mock';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), FIXTURES_DIR_FROM_ROOT);

function parseFixture(fileName: string): Participant[] {
  return parseTimerExport(readXlsxRows(readFileSync(join(FIXTURES_DIR, fileName))));
}

describe('timer-export-parser', () => {
  it('parses real exports: counts, first participant, DNF single-lap runner, NOTE! block excluded', () => {
    const participants14 = parseFixture(FIXTURE_14_FILE_NAME);
    const participants24 = parseFixture(FIXTURE_24_FILE_NAME);

    expect(participants14).toHaveLength(EXPECTED_PARTICIPANT_COUNT_14);
    expect(participants14[0]).toEqual(EXPECTED_FIRST_PARTICIPANT_14);
    expect(participants24).toHaveLength(EXPECTED_PARTICIPANT_COUNT_24);
    expect(participants24[KOVSHOVA_INDEX]).toEqual(EXPECTED_KOVSHOVA_PARTICIPANT);
    expect(participants24[EXPECTED_PARTICIPANT_COUNT_24 - 1].fullName).toBe(LAST_PARTICIPANT_NAME_24);
    expect(participants14.some((participant) => participant.fullName.startsWith(TIMER_EXPORT_NOTE_PREFIX))).toBe(false);
    expect(participants24.some((participant) => participant.fullName.startsWith(TIMER_EXPORT_NOTE_PREFIX))).toBe(false);
  });

  it('handles synthetic tables: trimmed case-insensitive header, missing laps, empty-name stop, end of rows, no header', () => {
    expect(parseTimerExport(SYNTHETIC_EXPORT_ROWS)).toEqual(EXPECTED_SYNTHETIC_PARTICIPANTS);
    expect(parseTimerExport(TRAILING_DATA_ROWS)).toEqual(EXPECTED_TRAILING_PARTICIPANTS);
    expect(parseTimerExport(HEADERLESS_ROWS)).toEqual([]);
  });
});
