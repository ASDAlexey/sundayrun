import { NOTE_TOKEN_DELIMITER } from './notes-builder.constant';

/** Splits a stored note into trimmed non-empty tokens; tolerates missing spaces after the delimiter. */
export function splitNote(note: string): string[] {
  return note.split(NOTE_TOKEN_DELIMITER).reduce<string[]>((tokens, part) => {
    const token = part.trim();

    if (token.length > 0) {
      tokens.push(token);
    }

    return tokens;
  }, []);
}
