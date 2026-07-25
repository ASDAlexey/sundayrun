import { ExpectedLapSample } from './runner-order.interface';
import { TimerRunnerOutcome } from './timer-session.enum';
import { TimerRunner } from './timer-session.interface';

export const FAST_ATHLETE_KEY = 'быстров антон';
export const STEADY_ATHLETE_KEY = 'средний борис';
export const SINGLE_RUN_ATHLETE_KEY = 'тоже средний виктор';
export const UNSEEN_ATHLETE_KEY = 'незнакомец григорий';

/** Three archived laps for one athlete, two for the next (an even sample), one for the third. */
export const EXPECTED_LAP_SAMPLES: ExpectedLapSample[] = [
  { key: FAST_ATHLETE_KEY, lapMs: 610_000 },
  { key: STEADY_ATHLETE_KEY, lapMs: 690_000 },
  { key: FAST_ATHLETE_KEY, lapMs: 590_000 },
  { key: SINGLE_RUN_ATHLETE_KEY, lapMs: 700_000 },
  { key: FAST_ATHLETE_KEY, lapMs: 600_000 },
  { key: STEADY_ATHLETE_KEY, lapMs: 710_000 },
];

export const EXPECTED_LAP_ENTRIES: [string, number][] = [
  [FAST_ATHLETE_KEY, 600_000],
  [STEADY_ATHLETE_KEY, 700_000],
  [SINGLE_RUN_ATHLETE_KEY, 700_000],
];

export const EXPECTED_LAP_BY_ATHLETE: ReadonlyMap<string, number> = new Map(EXPECTED_LAP_ENTRIES);

function buildOrderRunner(id: string, athleteKey: string | null): TimerRunner {
  return { id, fullName: id, athleteKey, gender: null, outcome: TimerRunnerOutcome.active };
}

export const UNSEEN_RUNNER_ID = 'runner-unseen';
export const NEWCOMER_RUNNER_ID = 'runner-newcomer';
export const SINGLE_RUN_RUNNER_ID = 'runner-single-run';
export const FAST_RUNNER_ID = 'runner-fast';
export const STEADY_RUNNER_ID = 'runner-steady';

/** Add order deliberately jumbled: an unseen key, a tie, a newcomer, then the two known times. */
export const ORDER_RUNNERS: TimerRunner[] = [
  buildOrderRunner(UNSEEN_RUNNER_ID, UNSEEN_ATHLETE_KEY),
  buildOrderRunner(SINGLE_RUN_RUNNER_ID, SINGLE_RUN_ATHLETE_KEY),
  buildOrderRunner(NEWCOMER_RUNNER_ID, null),
  buildOrderRunner(FAST_RUNNER_ID, FAST_ATHLETE_KEY),
  buildOrderRunner(STEADY_RUNNER_ID, STEADY_ATHLETE_KEY),
];

/** Fastest expected lap first; the tie keeps the add order, and both unknowns wait at the end. */
export const EXPECTED_RUNNER_ORDER: string[] = [
  FAST_RUNNER_ID,
  SINGLE_RUN_RUNNER_ID,
  STEADY_RUNNER_ID,
  UNSEEN_RUNNER_ID,
  NEWCOMER_RUNNER_ID,
];
