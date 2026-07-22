import { NAME_PART_PATTERN, SINGLE_SPACE, WHITESPACE_RUN_PATTERN } from './full-name-case.constant';

/** Normalizes a raw name to display case: 'дзюбак СЕРГЕЙ' → 'Дзюбак Сергей'; inner whitespace runs collapse to one space. */
export function normalizeFullNameCase(fullName: string): string {
  return fullName
    .replace(WHITESPACE_RUN_PATTERN, SINGLE_SPACE)
    .toLowerCase()
    .replace(NAME_PART_PATTERN, (part) => part[0].toUpperCase() + part.slice(1));
}
