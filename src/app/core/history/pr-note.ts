import { formatRaceTime, parseDuration } from '../time/duration';
import { MS_IN_SECOND } from '../time/duration.constant';
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

/** '20:52' + the previous best run → '20:52,00 · 12 янв 2025' — the dated form of the note's time. */
export function prNoteTimeWithDate(time: string, previousBest: PreviousBest): string {
  return `${preciseNoteTime(time, previousBest.timeMs)}${PR_NOTE_DATE_SEPARATOR}${formatRussianDateCompact(previousBest.dateIso)}`;
}

/**
 * The note's time redrawn to hundredths off the run it points at. Stored notes are written to whole
 * seconds, while the run itself may have been timed finer — so the record the note names is read
 * back from the archive rather than off the note's own text.
 *
 * The run is only trusted when the two agree to within a second, which whole-second rounding can
 * always manage. A note that drifted further than that is telling a different story than the
 * archive is, and it keeps its own text rather than being quietly overwritten by ours.
 */
function preciseNoteTime(time: string, timeMs: number): string {
  const noteMs = parseDuration(time);

  return noteMs !== null && Math.abs(noteMs - timeMs) < MS_IN_SECOND ? formatRaceTime(timeMs) : time;
}

/**
 * 'ЛР (было 20:52)' → 'ЛР (было 20:52,00 · 12 янв 2025)' for the PDF note cell. Without a record
 * token or a known previous run the note stays exactly as stored.
 */
export function prNoteWithDate(note: string, previousBest: PreviousBest | undefined): string {
  const parts = splitPrNote(note);

  if (parts === null || previousBest === undefined) {
    return note;
  }

  return `${parts.before}${prNoteTimeWithDate(parts.time, previousBest)}${parts.after}`;
}
