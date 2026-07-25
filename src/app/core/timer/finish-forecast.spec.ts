import { expectedNextRunnerIds, forecastFinishMs } from './finish-forecast';
import {
  EVEN_PACE_FINISH_MS,
  EVEN_PACE_LAP_MS,
  EXPECTED_NEXT_RUNNER_IDS,
  EXPECTED_NEXT_RUNNER_IDS_BEFORE_ANY_TAP,
  EXPECTED_NEXT_RUNNER_IDS_WITHOUT_HISTORY,
  ROUNDED_FINISH_MS,
  ROUNDED_LAP_MS,
  TIMER_EXPECTED_LAPS,
} from './finish-forecast.mock';
import { TIMER_SESSION, TIMER_SESSION_WITHOUT_SPLITS } from './timer-session.mock';

describe('forecastFinishMs', () => {
  it('scales the 2.3 km split up to 5 km at an even pace, in whole milliseconds', () => {
    expect(forecastFinishMs(EVEN_PACE_LAP_MS)).toBe(EVEN_PACE_FINISH_MS);
    expect(forecastFinishMs(ROUNDED_LAP_MS), 'a fractional forecast is rounded').toBe(ROUNDED_FINISH_MS);
  });
});

describe('expectedNextRunnerIds', () => {
  it('queues only the runners still on course, by archive lap before the lap and by forecast after it', () => {
    expect(expectedNextRunnerIds(TIMER_SESSION, TIMER_EXPECTED_LAPS)).toEqual(EXPECTED_NEXT_RUNNER_IDS);
    expect(expectedNextRunnerIds(TIMER_SESSION, new Map()), 'a runner without history waits at the end').toEqual(
      EXPECTED_NEXT_RUNNER_IDS_WITHOUT_HISTORY,
    );
    expect(expectedNextRunnerIds(TIMER_SESSION_WITHOUT_SPLITS, TIMER_EXPECTED_LAPS), 'before the first tap the whole field queues').toEqual(
      EXPECTED_NEXT_RUNNER_IDS_BEFORE_ANY_TAP,
    );
  });
});
