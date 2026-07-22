import {
  FIRST_PARTICIPATION_TOKEN_PATTERN,
  LEGACY_PERSONAL_RECORD_TOKEN_PATTERN,
  PERSONAL_RECORD_TOKEN_PATTERN,
  YEAR_BEST_TOKEN_PATTERN,
} from '../history/notes-builder.constant';
import { KIDS_NOTE_TOKEN_PATTERN, STATUS_NOTE_TOKEN_PATTERN } from './note-badge-kind.constant';
import { NoteBadgeKind, NoteBadgeKindType } from './note-badge-kind.enum';

/** Recognizes the auto-note tokens plus the organiser-written kids and DNF/DSQ marks. */
export function noteBadgeKindOf(token: string): NoteBadgeKindType {
  if (PERSONAL_RECORD_TOKEN_PATTERN.test(token) || LEGACY_PERSONAL_RECORD_TOKEN_PATTERN.test(token)) {
    return NoteBadgeKind.record;
  }

  if (YEAR_BEST_TOKEN_PATTERN.test(token)) {
    return NoteBadgeKind.yearBest;
  }

  if (FIRST_PARTICIPATION_TOKEN_PATTERN.test(token)) {
    return NoteBadgeKind.debut;
  }

  if (KIDS_NOTE_TOKEN_PATTERN.test(token)) {
    return NoteBadgeKind.kids;
  }

  if (STATUS_NOTE_TOKEN_PATTERN.test(token)) {
    return NoteBadgeKind.status;
  }

  return NoteBadgeKind.plain;
}
