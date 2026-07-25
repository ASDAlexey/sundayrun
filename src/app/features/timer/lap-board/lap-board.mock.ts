import { Gender, GenderType } from '../../../core/models/gender.enum';
import { INITIAL_PUBLISH_STATUS } from '../../../core/timer/timer-session.constant';
import { TimerRole, TimerRunnerOutcome, TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerRunner, TimerSession, TimerSplit } from '../../../core/timer/timer-session.interface';
import { TimerLapMark, TimerLapMarkType } from './lap-board.enum';

const ROOKIE_ID = 'lap-rookie';
const RECORD_ID = 'lap-record';
const BEST_ID = 'lap-best';
const STEADY_ID = 'lap-steady';
const NO_GENDER_ID = 'lap-no-gender';
const WAITING_ID = 'lap-waiting';

const RECORD_KEY = 'рекордсмен круга';
const BEST_KEY = 'улучшил себя';
const STEADY_KEY = 'ровный бегун';
const NO_GENDER_KEY = 'без пола';

const runner = (id: string, fullName: string, athleteKey: string | null, gender: GenderType | null): TimerRunner => ({
  id,
  fullName,
  athleteKey,
  gender,
  outcome: TimerRunnerOutcome.active,
});

const split = (id: string, atMs: number, runnerId: string): TimerSplit => ({ id, atMs, runnerId });

/**
 * A roster written so that every branch of the archive marks has an owner: a newcomer with no key, a
 * lap under the course record, a lap under the runner's own best only, a lap under neither, somebody
 * whose gender is still unknown and one runner nobody has tapped yet.
 */
const LAP_RUNNERS: TimerRunner[] = [
  runner(ROOKIE_ID, 'Новиков Илья', null, Gender.male),
  runner(RECORD_ID, 'Троилин Антон', RECORD_KEY, Gender.male),
  runner(BEST_ID, 'Романенко Елена', BEST_KEY, Gender.female),
  runner(STEADY_ID, 'Кузнецов Игорь', STEADY_KEY, Gender.male),
  runner(NO_GENDER_ID, 'Соколова Анна', NO_GENDER_KEY, null),
  runner(WAITING_ID, 'Зайцев Роман', null, Gender.male),
];

const LAP_SPLITS: TimerSplit[] = [
  split('lap-split-record', 500_000, RECORD_ID),
  split('lap-split-best', 600_000, BEST_ID),
  split('lap-split-rookie', 700_000, ROOKIE_ID),
  split('lap-split-steady', 900_000, STEADY_ID),
  split('lap-split-no-gender', 1_000_000, NO_GENDER_ID),
];

/** Five runners through the lap, one still out on the course. */
export const LAP_BOARD_SESSION: TimerSession = {
  id: 'lap-board-session',
  dateIso: '2026-07-26',
  createdAtMs: 1785_000_000_000,
  startedAtEpochMs: 1785_045_600_000,
  stoppedAtMs: null,
  status: TimerStatus.running,
  role: TimerRole.main,
  runners: LAP_RUNNERS,
  splits: LAP_SPLITS,
  publish: INITIAL_PUBLISH_STATUS,
};

/** The same roster before anybody was tapped — the «Ещё никто не прошёл круг» state. */
export const LAP_BOARD_SESSION_WITHOUT_SPLITS: TimerSession = { ...LAP_BOARD_SESSION, splits: [] };

/** The queued time of a pack: recorded between two laps, still nobody's, and Зайцев is untapped. */
export const LAP_QUEUED_SPLIT_ID = 'lap-split-queued';

export const LAP_BOARD_SESSION_QUEUED: TimerSession = {
  ...LAP_BOARD_SESSION,
  splits: [...LAP_SPLITS, { id: LAP_QUEUED_SPLIT_ID, atMs: 800_000, runnerId: null }],
};

/** It stands fourth — behind the 700 000 lap, ahead of the 900 000 one — and carries no surname. */
export const LAP_QUEUED_PLACE = 4;
export const LAP_QUEUED_NAME = 'без имени';
export const LAP_QUEUED_TIME_TEXT = '13:20';

/** The fastest first lap of the archive per gender: the male one is beaten, the female one is not. */
export const LAP_COURSE_RECORD_LAP_MS: Readonly<Record<GenderType, number | null>> = {
  [Gender.male]: 560_000,
  [Gender.female]: 580_000,
};

/** Personal bests: one runner beats his, one does not, and one is missing from the archive entirely. */
export const LAP_BEST_LAP_MS: ReadonlyMap<string, number> = new Map([
  [RECORD_KEY, 520_000],
  [BEST_KEY, 640_000],
  [STEADY_KEY, 800_000],
]);

/** The rows come out in roster order, so the places read 3 · 1 · 2 · 4 · 5. */
export const LAP_EXPECTED_PLACES = [3, 1, 2, 4, 5];

export const LAP_EXPECTED_MARKS: (TimerLapMarkType | null)[] = [null, TimerLapMark.courseRecord, TimerLapMark.personalBest, null, null];

/**
 * The travel counted in rows, the way the table now hands it to CSS: the third runner of the roster
 * came first, so his line goes two rows down and crosses both marked rows on the way; the two who
 * overtook him come up one row each and cross nothing.
 */
export const LAP_EXPECTED_ROW_STEPS = [2, -1, -1, 0, 0];

export const LAP_EXPECTED_NOTE_STEPS = [2, 0, 0, 0, 0];

export const LAP_EXPECTED_MOVED = [true, true, true, false, false];

export const LAP_EXPECTED_TIME_TEXTS = ['11:40', '8:20', '10:00', '15:00', '16:40'];

/** The leader of the lap chases nobody, so his gap column stays empty. */
export const LAP_EXPECTED_GAP_TEXTS = ['+3:20', '', '+1:40', '+6:40', '+8:20'];

/** One of the six is still out on the course. */
export const LAP_EXPECTED_PENDING_TEXT = 'ещё 1 не прошёл круг';

/** Nobody tapped yet: all six are still awaited. */
export const LAP_EXPECTED_PENDING_TEXT_ALL = 'ещё 6 не прошли круг';
