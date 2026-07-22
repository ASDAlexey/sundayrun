import { GenderConfidence, GenderSource } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import { parseDuration } from '../time/duration';
import { normalizeFullNameCase } from './full-name-case';
import {
  FIRST_PARTICIPANT_ID,
  LAP_COLUMN_INDEXES,
  NAME_COLUMN_INDEX,
  TIMER_EXPORT_HEADER_CELL,
  TIMER_EXPORT_NOTE_PREFIX,
  TOTAL_COLUMN_INDEX,
} from './timer-export-parser.constant';

/**
 * Parses rows of a timer xlsx export (Name, Total, Avg/lap, Avg/km, Lap 1, Lap 2)
 * into participants. Data starts after the header row and stops at the first row
 * with an empty name cell or at the trailing 'NOTE!' instruction block.
 * Names are re-cased to the display form ('дзюбак СЕРГЕЙ' → 'Дзюбак Сергей').
 */
export function parseTimerExport(rows: string[][]): Participant[] {
  const headerIndex = rows.findIndex((row) => cellAt(row, NAME_COLUMN_INDEX).toLowerCase() === TIMER_EXPORT_HEADER_CELL);

  if (headerIndex === -1) {
    return [];
  }

  const participants: Participant[] = [];

  for (const row of rows.slice(headerIndex + 1)) {
    const fullName = cellAt(row, NAME_COLUMN_INDEX);

    if (fullName === '' || fullName.startsWith(TIMER_EXPORT_NOTE_PREFIX)) {
      break;
    }

    participants.push(buildParticipant(row, normalizeFullNameCase(fullName), participants.length + FIRST_PARTICIPANT_ID));
  }

  return participants;
}

function buildParticipant(row: string[], fullName: string, id: number): Participant {
  return {
    id,
    fullName,
    totalMs: parseDuration(cellAt(row, TOTAL_COLUMN_INDEX)),
    lapsMs: readLapsMs(row),
    gender: null,
    genderConfidence: GenderConfidence.unknown,
    genderSource: GenderSource.unknown,
    note: '',
    club: '',
  };
}

/** Laps with trailing nulls removed: missing Lap 2 → single-lap runner, both missing → empty array. */
function readLapsMs(row: string[]): (number | null)[] {
  const lapsMs = LAP_COLUMN_INDEXES.map((column) => parseDuration(cellAt(row, column)));

  while (lapsMs.length > 0 && lapsMs[lapsMs.length - 1] === null) {
    lapsMs.pop();
  }

  return lapsMs;
}

function cellAt(row: string[], index: number): string {
  return (row[index] ?? '').trim();
}
