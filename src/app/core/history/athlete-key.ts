import { SINGLE_SPACE, WHITESPACE_RUN_PATTERN, YE_LETTER, YO_LETTER_PATTERN } from './athlete-key.constant';

/** Normalizes a full name into a stable athlete key: trim, collapse inner whitespace, lowercase, 'ё' → 'е'. */
export function normalizeAthleteKey(fullName: string): string {
  return fullName.trim().replace(WHITESPACE_RUN_PATTERN, SINGLE_SPACE).toLowerCase().replace(YO_LETTER_PATTERN, YE_LETTER);
}
