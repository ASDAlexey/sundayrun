import { expectedLapMsByAthlete, expectedLapMsFor, orderRunnersByExpectedLap } from './runner-order';
import {
  EXPECTED_LAP_BY_ATHLETE,
  EXPECTED_LAP_ENTRIES,
  EXPECTED_LAP_SAMPLES,
  EXPECTED_RUNNER_ORDER,
  ORDER_RUNNERS,
} from './runner-order.mock';

describe('expectedLapMsByAthlete', () => {
  it('takes the median lap per athlete key, averaging the middle pair of an even sample', () => {
    expect([...expectedLapMsByAthlete(EXPECTED_LAP_SAMPLES)]).toEqual(EXPECTED_LAP_ENTRIES);
    expect([...expectedLapMsByAthlete([])], 'no archive means no expectations').toEqual([]);
  });
});

describe('orderRunnersByExpectedLap', () => {
  it('puts the fastest expected lap first, keeps ties in add order and leaves the unknown at the end', () => {
    expect(orderRunnersByExpectedLap(ORDER_RUNNERS, EXPECTED_LAP_BY_ATHLETE).map((runner) => runner.id)).toEqual(EXPECTED_RUNNER_ORDER);
    expect(
      orderRunnersByExpectedLap(ORDER_RUNNERS, new Map()).map((runner) => runner.id),
      'with an empty archive the add order stands',
    ).toEqual(ORDER_RUNNERS.map((runner) => runner.id));
    expect(expectedLapMsFor(ORDER_RUNNERS[2], EXPECTED_LAP_BY_ATHLETE), 'a newcomer has no expected lap').toBeNull();
  });
});
