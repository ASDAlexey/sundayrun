import { formatRussianDateCompact } from '../time/russian-date';
import { PR_NOTE_DATE_SEPARATOR, PR_NOTE_SPLIT_PATTERN } from './pr-note.constant';
import { PrNoteParts } from './pr-note.interface';
import { PreviousBest } from './previous-bests.interface';

/**
 * Splits a stored note around its «ЛР (было X)» token, so the previous time can carry the date of
 * the run it refers to (and, on the web protocol, link to it). Null when the note has no record token.
 */
export function splitPrNote(note: string): PrNoteParts | null {
  const match = PR_NOTE_SPLIT_PATTERN.exec(note);

  if (match === null) {
    return null;
  }

  const [, before, time, after] = match;

  return { before, time, after };
}

/** '20:52' + the previous best run → '20:52 · 12 янв 2025' — the dated form of the note's time. */
export function prNoteTimeWithDate(time: string, previousBest: PreviousBest): string {
  return `${time}${PR_NOTE_DATE_SEPARATOR}${formatRussianDateCompact(previousBest.dateIso)}`;
}

/**
 * 'ЛР (было 20:52)' → 'ЛР (было 20:52 · 12 янв 2025)' for the PDF note cell. Without a record
 * token or a known previous run the note stays exactly as stored.
 */
export function prNoteWithDate(note: string, previousBest: PreviousBest | undefined): string {
  const parts = splitPrNote(note);

  if (parts === null || previousBest === undefined) {
    return note;
  }

  return `${parts.before}${prNoteTimeWithDate(parts.time, previousBest)}${parts.after}`;
}
