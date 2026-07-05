import { AthleteRecord } from '../models/athlete-history.interface';
import { AthletesHistory } from '../models/athletes-history.type';
import { formatDuration } from '../time/duration';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import {
  EMPTY_NOTE,
  FIRST_PARTICIPATION_NOTE,
  PERSONAL_RECORD_NOTE_TEMPLATE,
  TIME_PLACEHOLDER,
  YEAR_BEST_NOTE_TEMPLATE,
  YEAR_PLACEHOLDER,
} from './notes-builder.constant';
import { AutoNoteInput } from './notes-builder.interface';

/**
 * Builds the automatic note for one result against the history accumulated BEFORE the event:
 * - DNF → '';
 * - unknown athlete (or a record with zero runs) with a time → 'Первое участие';
 * - 2.3 km with an existing record → '';
 * - 5 km strictly better than the all-time best → 'ЛР (было X)';
 * - otherwise better than the year best (or first 5 km run of the year) → 'Лучший результат YYYY г.';
 * - otherwise ''.
 */
export function buildAutoNote(input: AutoNoteInput, history: AthletesHistory): string {
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

  if (record.bestMs !== null && input.timeMs < record.bestMs) {
    return PERSONAL_RECORD_NOTE_TEMPLATE.replace(TIME_PLACEHOLDER, formatDuration(record.bestMs));
  }

  const year = isoYear(input.dateIso);
  const yearBestMs: number | undefined = record.bestMsByYear[year];

  if (yearBestMs === undefined || input.timeMs < yearBestMs) {
    return YEAR_BEST_NOTE_TEMPLATE.replace(YEAR_PLACEHOLDER, year);
  }

  return EMPTY_NOTE;
}
