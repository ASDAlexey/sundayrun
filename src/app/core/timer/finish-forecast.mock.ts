import {
  KUZNETSOV_ATHLETE_KEY,
  KUZNETSOV_RUNNER_ID,
  POPOV_ALEKSEY_ATHLETE_KEY,
  POPOV_ALEKSEY_RUNNER_ID,
  POPOV_IGOR_ATHLETE_KEY,
  POPOV_IGOR_RUNNER_ID,
  SOKOLOVA_RUNNER_ID,
  TROILIN_ATHLETE_KEY,
  TROILIN_RUNNER_ID,
} from './timer-session.mock';

/** A lap that divides evenly: 11:30 over 2.3 km is 25:00 over 5 km at the same pace. */
export const EVEN_PACE_LAP_MS = 690_000;
export const EVEN_PACE_FINISH_MS = 1_500_000;

/** 9:26 over 2.3 km — the forecast lands between whole milliseconds and is rounded. */
export const ROUNDED_LAP_MS = 566_000;
export const ROUNDED_FINISH_MS = 1_230_435;

/** The archive medians of everybody in the fixture who has a history at all. */
export const TIMER_EXPECTED_LAPS: ReadonlyMap<string, number> = new Map([
  [TROILIN_ATHLETE_KEY, 570_000],
  [POPOV_ALEKSEY_ATHLETE_KEY, 700_000],
  [POPOV_IGOR_ATHLETE_KEY, 660_000],
  [KUZNETSOV_ATHLETE_KEY, 690_000],
]);

/** Mid-race: the runner still waiting for his lap is due before the one already forecast to finish. */
export const EXPECTED_NEXT_RUNNER_IDS: string[] = [KUZNETSOV_RUNNER_ID, POPOV_IGOR_RUNNER_ID];

/** Without any archive the runner who has already run a lap is the only one we can place. */
export const EXPECTED_NEXT_RUNNER_IDS_WITHOUT_HISTORY: string[] = [POPOV_IGOR_RUNNER_ID, KUZNETSOV_RUNNER_ID];

/** Before the first tap everybody still on course queues by his archive lap, the newcomer last. */
export const EXPECTED_NEXT_RUNNER_IDS_BEFORE_ANY_TAP: string[] = [
  TROILIN_RUNNER_ID,
  POPOV_IGOR_RUNNER_ID,
  KUZNETSOV_RUNNER_ID,
  POPOV_ALEKSEY_RUNNER_ID,
  SOKOLOVA_RUNNER_ID,
];
