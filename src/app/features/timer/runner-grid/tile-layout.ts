import { normalizeAthleteKey } from '../../../core/history/athlete-key';
import { NAME_PART_SEPARATOR } from '../../../core/timer/timer-session.constant';
import { TimerDensity, TimerDensityChoice, TimerDensityChoiceType, TimerDensityType } from './runner-grid.enum';
import { TimerTileName } from './runner-grid.interface';
import {
  TIMER_DENSITY_LARGE_MAX,
  TIMER_DENSITY_MEDIUM_MAX,
  TIMER_DENSITY_SMALL_MAX,
  TIMER_INK_COUNT,
  TIMER_INK_FIRST,
  TIMER_INK_HASH_FACTOR,
  TIMER_INK_HASH_MODULO,
  TIMER_INK_HASH_SEED,
  TIMER_NAME_INITIAL_LENGTH,
  TIMER_NAME_INITIAL_SUFFIX,
  TIMER_NAME_NO_SEPARATOR,
  TIMER_TILE_EMPTY_GIVEN,
} from './runner-grid.constant';

/**
 * How much a tile is asked to *say* for a field of this size, unless the organiser picked it by hand
 * in the «⋮» menu: a full first name and a large face up to twelve people, an initial past twenty-two,
 * the tightest reading past twenty-four (docs/TIMER.md §4).
 *
 * It is deliberately no longer a statement about how many tiles fit on a screen. The stylesheet takes
 * these four steps as a minimum tile width and lets `repeat(auto-fill, …)` count the columns from the
 * width it actually has, so the same choice works on a 320 px phone and on a tablet without a table of
 * thresholds pretending to know the viewport.
 */
export function resolveTimerDensity(choice: TimerDensityChoiceType, runnerCount: number): TimerDensityType {
  if (choice !== TimerDensityChoice.auto) {
    return choice;
  }

  if (runnerCount <= TIMER_DENSITY_LARGE_MAX) {
    return TimerDensity.large;
  }

  if (runnerCount <= TIMER_DENSITY_MEDIUM_MAX) {
    return TimerDensity.medium;
  }

  return runnerCount <= TIMER_DENSITY_SMALL_MAX ? TimerDensity.small : TimerDensity.dense;
}

/**
 * The personal ink of a tile, 1…15. In a dense grid the eye finds a person by colour and position
 * long before it reads the surname, and the same colour tells two namesakes apart. The hash runs on
 * the normalized key, so «Пётр» and «Петр» keep one colour across sessions.
 */
export function tileInkIndex(fullName: string): number {
  const key = normalizeAthleteKey(fullName);
  let hash = TIMER_INK_HASH_SEED;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * TIMER_INK_HASH_FACTOR + key.charCodeAt(index)) % TIMER_INK_HASH_MODULO;
  }

  return (hash % TIMER_INK_COUNT) + TIMER_INK_FIRST;
}

/**
 * «Попов Алексей» split for the tile: the surname is the whole opening token, the first name goes
 * under it — spelled out where there is room, cut to «А.» where there is not. One name alone leaves
 * the second line empty; nothing is ever invented to fill it.
 */
export function splitTimerName(fullName: string, spellGiven: boolean): TimerTileName {
  const trimmed = fullName.trim();
  const separator = trimmed.indexOf(NAME_PART_SEPARATOR);

  if (separator === TIMER_NAME_NO_SEPARATOR) {
    return { givenName: TIMER_TILE_EMPTY_GIVEN, surname: trimmed };
  }

  const given = trimmed.slice(separator + NAME_PART_SEPARATOR.length).trim();

  return {
    givenName: spellGiven ? given : `${given.slice(0, TIMER_NAME_INITIAL_LENGTH)}${TIMER_NAME_INITIAL_SUFFIX}`,
    surname: trimmed.slice(0, separator),
  };
}
