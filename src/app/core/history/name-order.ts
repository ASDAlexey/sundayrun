import { inferGender } from '../gender/gender-inference';
import { RUSSIAN_FEMALE_NAMES, RUSSIAN_MALE_NAMES } from '../gender/russian-names.constant';
import { AthletesHistory } from '../models/athletes-history.type';
import { GenderConfidence, GenderSource } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import { normalizeAthleteKey } from './athlete-key';
import { SINGLE_SPACE, WHITESPACE_RUN_PATTERN } from './athlete-key.constant';
import { SWAPPABLE_NAME_TOKEN_COUNT } from './name-order.constant';

/**
 * Restores the archive's 'Фамилия Имя' order for a name the source protocol wrote as 'Имя
 * Фамилия'. An exact archive match keeps the name as imported; a match with the words swapped
 * adopts the archived spelling (its canonical case and 'ё'); otherwise a two-word name whose
 * first word is a known first name — and whose second is not — gets its words swapped.
 * Ambiguous names (both words are first names, three-plus words) are returned untouched.
 */
export function resolveNameOrder(fullName: string, history: AthletesHistory): string {
  const key = normalizeAthleteKey(fullName);

  if (history[key] !== undefined) {
    return fullName;
  }

  const tokens = key.split(SINGLE_SPACE);

  if (tokens.length !== SWAPPABLE_NAME_TOKEN_COUNT) {
    return fullName;
  }

  const [firstWord, secondWord] = tokens;
  const swappedMatch = history[`${secondWord}${SINGLE_SPACE}${firstWord}`];

  if (swappedMatch !== undefined) {
    return swappedMatch.displayName;
  }

  return isKnownFirstName(firstWord) && !isKnownFirstName(secondWord) ? swapWords(fullName) : fullName;
}

/**
 * The participant with the archive-checked name order; when the order changes, the gender is
 * re-derived — taken from the matched archive record when it has one, re-inferred from the
 * corrected name otherwise. A manually verified gender survives the swap. An untouched name
 * returns the very same participant object, so signal updates can skip unchanged drafts.
 */
export function withResolvedNameOrder(participant: Participant, history: AthletesHistory): Participant {
  const fullName = resolveNameOrder(participant.fullName, history);

  if (fullName === participant.fullName) {
    return participant;
  }

  if (participant.genderSource === GenderSource.manual) {
    return { ...participant, fullName };
  }

  const archivedGender = history[normalizeAthleteKey(fullName)]?.gender ?? null;

  if (archivedGender !== null) {
    return {
      ...participant,
      fullName,
      gender: archivedGender,
      genderConfidence: GenderConfidence.high,
      genderSource: GenderSource.history,
    };
  }

  const inference = inferGender(fullName);

  return { ...participant, fullName, gender: inference.gender, genderConfidence: inference.confidence, genderSource: inference.source };
}

function isKnownFirstName(token: string): boolean {
  return RUSSIAN_MALE_NAMES.has(token) || RUSSIAN_FEMALE_NAMES.has(token);
}

function swapWords(fullName: string): string {
  const [firstWord, secondWord] = fullName.trim().split(WHITESPACE_RUN_PATTERN);

  return `${secondWord}${SINGLE_SPACE}${firstWord}`;
}
