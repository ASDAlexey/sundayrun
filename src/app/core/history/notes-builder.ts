import { AthleteRecord } from '../models/athlete-history.interface';
import { AthletesHistory } from '../models/athletes-history.type';
import { formatDuration } from '../time/duration';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import {
  EMPTY_NOTE,
  FIRST_PARTICIPATION_NOTE,
  NOTE_SEPARATOR,
  PERSONAL_RECORD_NOTE_TEMPLATE,
  TIME_PLACEHOLDER,
  YEAR_BEST_NOTE_TEMPLATE,
  YEAR_PLACEHOLDER,
} from './notes-builder.constant';
import { AutoNoteInput } from './notes-builder.interface';

/**
 * Builds the automatic note for one result against the history accumulated BEFORE the result:
 * - DNF → '';
 * - unknown athlete (or a record with zero runs) with a time → 'Первое участие';
 * - a non-5 km distance with an existing record → '';
 * - 5 km strictly better than the athlete's all-time best → 'ЛР (было X)';
 * - 5 km strictly better than `courseYearBestMs` — the year's best 5 km time among ALL athletes
 *   of the same gender, including earlier finishers of the same event (see
 *   `buildEventAutoNotes`) — → 'Лучший результат YYYY г.'; nothing to beat yet → no note;
 * - both notes combine with '; ', matching the historical protocols.
 */
export function buildAutoNote(input: AutoNoteInput, history: AthletesHistory, courseYearBestMs: number | null): string {
  if (input.timeMs === null) {
    return EMPTY_NOTE;
  }

  const record: AthleteRecord | undefined = history[input.key];

  if (record === undefined || record.runs.length === 0) {
    return FIRST_PARTICIPATION_NOTE;
  }

  if (input.distanceKm !== FIVE_KM_DISTANCE_KM) {
    return EMPTY_NOTE;
  }

  const tokens: string[] = [];

  if (record.bestMs !== null && input.timeMs < record.bestMs) {
    tokens.push(PERSONAL_RECORD_NOTE_TEMPLATE.replace(TIME_PLACEHOLDER, formatDuration(record.bestMs)));
  }

  if (courseYearBestMs !== null && input.timeMs < courseYearBestMs) {
    tokens.push(YEAR_BEST_NOTE_TEMPLATE.replace(YEAR_PLACEHOLDER, isoYear(input.dateIso)));
  }

  return tokens.join(NOTE_SEPARATOR);
}
