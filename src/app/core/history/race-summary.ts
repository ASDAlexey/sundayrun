import { ProtocolRow } from '../models/protocol-row.interface';
import { splitNote } from './note-tokens';
import {
  FIRST_PARTICIPATION_TOKEN_PATTERN,
  LEGACY_PERSONAL_RECORD_TOKEN_PATTERN,
  PERSONAL_RECORD_TOKEN_PATTERN,
} from './notes-builder.constant';
import { RaceSummary } from './race-summary.interface';

/**
 * Aggregates the summary counters over the protocol rows. The newcomer and record counts come
 * from the auto-note tokens already stored on every row (see `buildAutoNote`), so no history
 * lookup is needed; organiser-written tokens like 'Дети' or 'Рекорд трассы' are ignored.
 */
export function summarizeRace(rows: ProtocolRow[]): RaceSummary {
  const summary: RaceSummary = { finisherCount: 0, newcomerCount: 0, personalRecordCount: 0 };

  for (const row of rows) {
    if (row.totalMs !== null) {
      summary.finisherCount += 1;
    }

    if (isNewcomerNote(row.note)) {
      summary.newcomerCount += 1;
    }

    if (isPersonalRecordNote(row.note)) {
      summary.personalRecordCount += 1;
    }
  }

  return summary;
}

/** True when the note carries the 'Первое участие' auto token. */
export function isNewcomerNote(note: string): boolean {
  return splitNote(note).some((token) => FIRST_PARTICIPATION_TOKEN_PATTERN.test(token));
}

/** True when the note carries a record token, including the legacy hand-typed 'Личный рекорд'. */
export function isPersonalRecordNote(note: string): boolean {
  return splitNote(note).some((token) => PERSONAL_RECORD_TOKEN_PATTERN.test(token) || LEGACY_PERSONAL_RECORD_TOKEN_PATTERN.test(token));
}
