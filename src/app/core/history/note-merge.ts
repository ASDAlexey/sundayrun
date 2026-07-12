import { splitNote } from './note-tokens';
import { AUTO_NOTE_TOKEN_PATTERNS, NOTE_SEPARATOR } from './notes-builder.constant';

/**
 * Combines a freshly computed auto note with the note already stored on the row: the stored
 * note's auto-generated tokens are dropped (they may be stale after an archive change) while
 * every other token — organiser-written text like 'Дети', 'DNF' or 'Рекорд трассы' — is kept
 * after the auto part. Idempotent: re-running a recompute never duplicates or loses manual text.
 */
export function mergeAutoNote(autoNote: string, storedNote: string): string {
  const manualTokens = splitNote(storedNote).filter((token) => !isAutoToken(token));

  return [...splitNote(autoNote), ...manualTokens].join(NOTE_SEPARATOR);
}

function isAutoToken(token: string): boolean {
  return AUTO_NOTE_TOKEN_PATTERNS.some((pattern) => pattern.test(token));
}
