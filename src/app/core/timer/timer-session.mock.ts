import { Gender, GenderType } from '../models/gender.enum';
import { INITIAL_PUBLISH_STATUS } from './timer-session.constant';
import { TimerRole, TimerRunnerOutcome, TimerRunnerOutcomeType, TimerStatus } from './timer-session.enum';
import { TimerRunner, TimerSession, TimerSplit } from './timer-session.interface';

export const TIMER_SESSION_ID = 'session-2026-07-26';
export const TIMER_SESSION_DATE_ISO = '2026-07-26';
export const TIMER_SESSION_CREATED_AT_MS = 1785_000_000_000;
export const TIMER_SESSION_STARTED_AT_EPOCH_MS = 1785_045_600_000;
export const TIMER_SESSION_STOPPED_AT_MS = 1_800_000;

export const TROILIN_RUNNER_ID = 'runner-troilin';
export const POPOV_ALEKSEY_RUNNER_ID = 'runner-popov-aleksey';
export const POPOV_IGOR_RUNNER_ID = 'runner-popov-igor';
export const ROMANENKO_RUNNER_ID = 'runner-romanenko';
export const SOKOLOVA_RUNNER_ID = 'runner-sokolova';
export const IVANOV_RUNNER_ID = 'runner-ivanov';
export const KUZNETSOV_RUNNER_ID = 'runner-kuznetsov';

export const TROILIN_ATHLETE_KEY = 'троилин антон';
export const POPOV_ALEKSEY_ATHLETE_KEY = 'попов алексей';
export const POPOV_IGOR_ATHLETE_KEY = 'попов игорь';
export const ROMANENKO_ATHLETE_KEY = 'романенко елена';
export const IVANOV_ATHLETE_KEY = 'иванов дмитрий';
export const KUZNETSOV_ATHLETE_KEY = 'кузнецов петр';

export const TROILIN_LAP_MS = 566_000;
export const POPOV_IGOR_LAP_MS = 668_000;
export const ROMANENKO_LAP_MS = 680_000;
export const POPOV_ALEKSEY_LAP_MS = 701_000;
export const SOKOLOVA_LAP_MS = 720_000;
export const IVANOV_LAP_MS = 754_000;

export const TROILIN_FINISH_MS = 1_406_000;
export const POPOV_ALEKSEY_FINISH_MS = 1_580_000;
export const SOKOLOVA_FINISH_MS = 1_620_000;

export const FIRST_UNNAMED_SPLIT_MS = 1_655_000;
export const SECOND_UNNAMED_SPLIT_MS = 1_690_000;

export const TROILIN_LAP_SPLIT_ID = 'split-01';
export const POPOV_IGOR_LAP_SPLIT_ID = 'split-02';
export const ROMANENKO_LAP_SPLIT_ID = 'split-03';
export const POPOV_ALEKSEY_LAP_SPLIT_ID = 'split-04';
export const SOKOLOVA_LAP_SPLIT_ID = 'split-05';
export const IVANOV_LAP_SPLIT_ID = 'split-06';
export const TROILIN_FINISH_SPLIT_ID = 'split-07';
export const POPOV_ALEKSEY_FINISH_SPLIT_ID = 'split-08';
export const SOKOLOVA_FINISH_SPLIT_ID = 'split-09';
export const FIRST_UNNAMED_SPLIT_ID = 'split-10';
export const SECOND_UNNAMED_SPLIT_ID = 'split-11';

function buildRunner(
  id: string,
  fullName: string,
  athleteKey: string | null,
  gender: GenderType | null,
  outcome: TimerRunnerOutcomeType = TimerRunnerOutcome.active,
): TimerRunner {
  return { id, fullName, athleteKey, gender, outcome };
}

function buildSplit(id: string, atMs: number, runnerId: string | null): TimerSplit {
  return { id, atMs, runnerId };
}

/**
 * A realistic roster: two clean finishers, two brothers sharing a surname (one of them still out on
 * the course), a runner who stopped after the lap, a newcomer without a gender, an explicit DNF and
 * somebody who has not been tapped at all.
 */
export const TIMER_SESSION_RUNNERS: TimerRunner[] = [
  buildRunner(TROILIN_RUNNER_ID, 'Троилин Антон', TROILIN_ATHLETE_KEY, Gender.male),
  buildRunner(POPOV_ALEKSEY_RUNNER_ID, 'Попов Алексей', POPOV_ALEKSEY_ATHLETE_KEY, Gender.male),
  buildRunner(POPOV_IGOR_RUNNER_ID, 'Попов Игорь', POPOV_IGOR_ATHLETE_KEY, Gender.male),
  buildRunner(ROMANENKO_RUNNER_ID, 'Романенко Елена', ROMANENKO_ATHLETE_KEY, Gender.female, TimerRunnerOutcome.lapOnly),
  buildRunner(SOKOLOVA_RUNNER_ID, 'Соколова Анна', null, null),
  buildRunner(IVANOV_RUNNER_ID, 'Иванов Дмитрий', IVANOV_ATHLETE_KEY, Gender.male, TimerRunnerOutcome.dnf),
  buildRunner(KUZNETSOV_RUNNER_ID, 'Кузнецов Пётр', KUZNETSOV_ATHLETE_KEY, Gender.male),
];

/** The journal in tap order: the whole lap pack first, then the finishes, then two unnamed times. */
export const TIMER_SESSION_SPLITS: TimerSplit[] = [
  buildSplit(TROILIN_LAP_SPLIT_ID, TROILIN_LAP_MS, TROILIN_RUNNER_ID),
  buildSplit(POPOV_IGOR_LAP_SPLIT_ID, POPOV_IGOR_LAP_MS, POPOV_IGOR_RUNNER_ID),
  buildSplit(ROMANENKO_LAP_SPLIT_ID, ROMANENKO_LAP_MS, ROMANENKO_RUNNER_ID),
  buildSplit(POPOV_ALEKSEY_LAP_SPLIT_ID, POPOV_ALEKSEY_LAP_MS, POPOV_ALEKSEY_RUNNER_ID),
  buildSplit(SOKOLOVA_LAP_SPLIT_ID, SOKOLOVA_LAP_MS, SOKOLOVA_RUNNER_ID),
  buildSplit(IVANOV_LAP_SPLIT_ID, IVANOV_LAP_MS, IVANOV_RUNNER_ID),
  buildSplit(TROILIN_FINISH_SPLIT_ID, TROILIN_FINISH_MS, TROILIN_RUNNER_ID),
  buildSplit(POPOV_ALEKSEY_FINISH_SPLIT_ID, POPOV_ALEKSEY_FINISH_MS, POPOV_ALEKSEY_RUNNER_ID),
  buildSplit(SOKOLOVA_FINISH_SPLIT_ID, SOKOLOVA_FINISH_MS, SOKOLOVA_RUNNER_ID),
  buildSplit(FIRST_UNNAMED_SPLIT_ID, FIRST_UNNAMED_SPLIT_MS, null),
  buildSplit(SECOND_UNNAMED_SPLIT_ID, SECOND_UNNAMED_SPLIT_MS, null),
];

/** The race in progress: the clock runs, most of the field is timed, two times wait for a name. */
export const TIMER_SESSION: TimerSession = {
  id: TIMER_SESSION_ID,
  dateIso: TIMER_SESSION_DATE_ISO,
  createdAtMs: TIMER_SESSION_CREATED_AT_MS,
  startedAtEpochMs: TIMER_SESSION_STARTED_AT_EPOCH_MS,
  stoppedAtMs: null,
  status: TimerStatus.running,
  role: TimerRole.main,
  runners: TIMER_SESSION_RUNNERS,
  splits: TIMER_SESSION_SPLITS,
  publish: INITIAL_PUBLISH_STATUS,
};

/** The same roster before the mass start — nothing is timed yet. */
export const TIMER_SESSION_IDLE: TimerSession = {
  ...TIMER_SESSION,
  startedAtEpochMs: null,
  status: TimerStatus.idle,
  splits: [],
};

/** The same race after the clock was stopped — what the publish step gets to see. */
export const TIMER_SESSION_FINISHED: TimerSession = {
  ...TIMER_SESSION,
  stoppedAtMs: TIMER_SESSION_STOPPED_AT_MS,
  status: TimerStatus.finished,
};

/** A session with a roster but an empty journal, for the "nothing recorded yet" branches. */
export const TIMER_SESSION_WITHOUT_SPLITS: TimerSession = { ...TIMER_SESSION, splits: [] };

/** Nothing but the queue: the whole active field is still waiting for its very first tap. */
export const TIMER_SESSION_ONLY_QUEUE: TimerSession = {
  ...TIMER_SESSION,
  splits: TIMER_SESSION_SPLITS.filter((split) => split.runnerId === null),
};

export const KUZNETSOV_LAP_SPLIT_ID = 'split-12';
export const KUZNETSOV_LAP_MS = 780_000;

/** Everybody is round, so a nameless time can only ever be somebody's finish now. */
export const TIMER_SESSION_LAP_COMPLETE: TimerSession = {
  ...TIMER_SESSION,
  splits: [...TIMER_SESSION_SPLITS, buildSplit(KUZNETSOV_LAP_SPLIT_ID, KUZNETSOV_LAP_MS, KUZNETSOV_RUNNER_ID)],
};

/** Both nameless times fell before every lap of the race — nobody owed a finish can be given one. */
export const STALE_UNNAMED_SPLIT_MS = 100_000;

export const TIMER_SESSION_STALE_QUEUE: TimerSession = {
  ...TIMER_SESSION,
  splits: TIMER_SESSION_SPLITS.map((split) => (split.runnerId === null ? { ...split, atMs: STALE_UNNAMED_SPLIT_MS } : split)),
};
