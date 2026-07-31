import { TimerSession } from '../../../core/timer/timer-session.interface';
import { SOKOLOVA_RUNNER_ID, TIMER_SESSION, TIMER_SESSION_SPLITS } from '../../../core/timer/timer-session.mock';

/**
 * Соколова's own taps taken away, so the lap half holds two surnames instead of one: the handout
 * that ends before its last row — the tap on Кузнецов leaves her alone, and alone is not a choice.
 */
export const TAPE_SESSION_TWO_LAPS: TimerSession = {
  ...TIMER_SESSION,
  splits: TIMER_SESSION_SPLITS.filter((split) => split.runnerId !== SOKOLOVA_RUNNER_ID),
};

/** Both surnames the lap half of {@link TAPE_SESSION_TWO_LAPS} offers, in roster order. */
export const TAPE_TWO_LAP_ROW_NAMES = ['Соколова Анна', 'Кузнецов Пётр'];

/** Whom the lap half of the fixture roster can hand a time to: the one man nobody has tapped. */
export const TAPE_LAP_ROW_NAMES = ['Кузнецов Пётр'];

/** A list of equals explains nothing about its rows — the lap half shows no meta at all. */
export const TAPE_LAP_ROW_META = [''];

/** And whom the finish half can: the one man with a lap and no finish. The two retired ones are out. */
export const TAPE_FINISH_ROW_NAMES = ['Попов Игорь'];

/** The lap he already has, so a surname in a hurry can be checked against something. */
export const TAPE_FINISH_ROW_META = ['круг 11:08,00'];

/** The earliest nameless time of the fixture — the one both halves are about to write. */
export const TAPE_NEXT_TIME_TEXT = '27:35,00';

/** The heading of the open sheet: the keys that name the half are covered by the sheet itself. */
export const TAPE_LAP_HEADING = 'Разобрать круг';
export const TAPE_FINISH_HEADING = 'Разобрать финиш';

/** What the lap half says once everybody is round: the queue can only hold finishes. */
export const TAPE_NOBODY_LAP = 'Круг прошли все — время уходит в финиш.';

/** The counter tail of the first id the tape issues; the second one ends with `-000002`. */
export const TAPE_FIRST_SPLIT_ID_TAIL = '-000001';

/** The tail of the second id — proof the counter, not a clock, keeps the ids apart. */
export const TAPE_SECOND_SPLIT_ID_TAIL = '-000002';

/** «Разобрать» asked for once from the publish card; the sheet has to be open at that. */
export const TAPE_ONE_OPEN_REQUEST = 1;
