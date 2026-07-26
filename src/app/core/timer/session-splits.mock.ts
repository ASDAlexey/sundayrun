import { TimerRunnerOutcome, TimerRunnerStage, TimerRunnerStageType } from './timer-session.enum';
import { TimerRunner, TimerSession, TimerSplit } from './timer-session.interface';
import {
  FIRST_UNNAMED_SPLIT_ID,
  IVANOV_RUNNER_ID,
  KUZNETSOV_RUNNER_ID,
  POPOV_ALEKSEY_RUNNER_ID,
  POPOV_IGOR_RUNNER_ID,
  ROMANENKO_RUNNER_ID,
  SECOND_UNNAMED_SPLIT_ID,
  SOKOLOVA_RUNNER_ID,
  TIMER_SESSION,
  TIMER_SESSION_RUNNERS,
  TROILIN_FINISH_MS,
  TROILIN_FINISH_SPLIT_ID,
  TROILIN_LAP_MS,
  TROILIN_LAP_SPLIT_ID,
  TROILIN_RUNNER_ID,
} from './timer-session.mock';

/** Nobody with this id was ever added to the roster. */
export const UNKNOWN_RUNNER_ID = 'runner-nobody';

export const EXPECTED_TROILIN_SPLIT_IDS: string[] = [TROILIN_LAP_SPLIT_ID, TROILIN_FINISH_SPLIT_ID];
export const EXPECTED_TROILIN_SPLIT_TIMES_MS: number[] = [TROILIN_LAP_MS, TROILIN_FINISH_MS];
export const EXPECTED_UNASSIGNED_SPLIT_IDS: string[] = [FIRST_UNNAMED_SPLIT_ID, SECOND_UNNAMED_SPLIT_ID];

/**
 * Six runners are through the lap by name (the DNF ran it too) and three of them are through the
 * finish — plus the two nameless times, which belong to somebody as well: one covers the lap of the
 * man nobody has tapped, the other the finish still owed.
 */
export const EXPECTED_LAP_DONE_COUNT = 7;
export const EXPECTED_FINISH_DONE_COUNT = 4;

export const EXPECTED_STAGES: Record<string, TimerRunnerStageType> = {
  [TROILIN_RUNNER_ID]: TimerRunnerStage.finished,
  [POPOV_ALEKSEY_RUNNER_ID]: TimerRunnerStage.finished,
  [POPOV_IGOR_RUNNER_ID]: TimerRunnerStage.waitingFinish,
  [ROMANENKO_RUNNER_ID]: TimerRunnerStage.retired,
  [SOKOLOVA_RUNNER_ID]: TimerRunnerStage.finished,
  [IVANOV_RUNNER_ID]: TimerRunnerStage.retired,
  [KUZNETSOV_RUNNER_ID]: TimerRunnerStage.waitingLap,
  [UNKNOWN_RUNNER_ID]: TimerRunnerStage.retired,
};

/** The roster without the second Попов — every surname is then its own. */
export const UNIQUE_SURNAME_RUNNERS: TimerRunner[] = TIMER_SESSION_RUNNERS.filter((runner) => runner.id !== POPOV_IGOR_RUNNER_ID);

/** Case and «ё» must not hide a clash: «Ёлкин» and «елкин» are the same surname on a tile. */
export const YO_SURNAME_RUNNERS: TimerRunner[] = [
  { id: 'runner-yolkin', fullName: 'Ёлкин Иван', athleteKey: null, gender: null, outcome: TimerRunnerOutcome.active },
  { id: 'runner-elkin', fullName: 'елкин Пётр', athleteKey: null, gender: null, outcome: TimerRunnerOutcome.active },
];

export const EXPECTED_RUNNERS_WITHOUT_GENDER: TimerRunner[] = TIMER_SESSION_RUNNERS.filter((runner) => runner.id === SOKOLOVA_RUNNER_ID);

const POPOV_IGOR_FINISH_MS = 1_512_000;
const KUZNETSOV_LAP_MS = 690_000;
const KUZNETSOV_FINISH_MS = 1_495_000;

/**
 * The same race a couple of minutes later: the last two runners are home, so every single tile is
 * either finished or retired. This is the fixture of «последний финишировавший».
 */
export const COMPLETE_SESSION: TimerSession = {
  ...TIMER_SESSION,
  splits: [
    ...TIMER_SESSION.splits,
    { id: 'split-popov-igor-finish', atMs: POPOV_IGOR_FINISH_MS, runnerId: POPOV_IGOR_RUNNER_ID },
    { id: 'split-kuznetsov-lap', atMs: KUZNETSOV_LAP_MS, runnerId: KUZNETSOV_RUNNER_ID },
    { id: 'split-kuznetsov-finish', atMs: KUZNETSOV_FINISH_MS, runnerId: KUZNETSOV_RUNNER_ID },
  ],
};

/**
 * The same three taps that finish the race, only nobody has been named yet: the organiser hit
 * «ОТСЕЧКА» three times into the queue. The field owes exactly three taps, the queue holds five —
 * so there is nothing left to time, however many surnames are still missing.
 */
export const COMPLETE_BY_QUEUE_SESSION: TimerSession = {
  ...TIMER_SESSION,
  splits: [
    ...TIMER_SESSION.splits,
    { id: 'split-queued-first', atMs: POPOV_IGOR_FINISH_MS, runnerId: null },
    { id: 'split-queued-second', atMs: KUZNETSOV_LAP_MS, runnerId: null },
    { id: 'split-queued-third', atMs: KUZNETSOV_FINISH_MS, runnerId: null },
  ],
};

/** Троилин came home first, and nobody who finished later took that away from him. */
export const EXPECTED_BEST_FINISH_MS = TROILIN_FINISH_MS;

const TIED_SPLIT_MS = 1_700_000;

const TIED_UNNAMED_SPLITS: TimerSplit[] = [
  { id: 'split-tied-second', atMs: TIED_SPLIT_MS, runnerId: null },
  { id: 'split-tied-first', atMs: TIED_SPLIT_MS, runnerId: null },
];

/** Two unnamed times taken at the very same millisecond — the journal order has to survive. */
export const TIED_SPLITS_SESSION: TimerSession = { ...TIMER_SESSION, splits: TIED_UNNAMED_SPLITS };

export const EXPECTED_TIED_SPLIT_IDS: string[] = TIED_UNNAMED_SPLITS.map((split) => split.id);
