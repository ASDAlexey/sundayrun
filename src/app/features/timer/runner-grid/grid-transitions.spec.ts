import { TimerRunnerOutcome } from '../../../core/timer/timer-session.enum';
import { KUZNETSOV_RUNNER_ID, TIMER_SESSION, TROILIN_FINISH_SPLIT_ID, TROILIN_RUNNER_ID } from '../../../core/timer/timer-session.mock';
import { removeNewestSplit, retireOutcome } from './grid-transitions';

describe('removeNewestSplit', () => {
  it('takes the runner newest time back and leaves a runner with nothing alone', () => {
    const rolled = removeNewestSplit(TIMER_SESSION, TROILIN_RUNNER_ID);

    expect(rolled.splits.some((split) => split.id === TROILIN_FINISH_SPLIT_ID)).toBe(false);
    expect(rolled.splits.length).toBe(TIMER_SESSION.splits.length - 1);
    expect(removeNewestSplit(TIMER_SESSION, KUZNETSOV_RUNNER_ID), 'nothing to roll back costs no storage write').toBe(TIMER_SESSION);
  });
});

describe('retireOutcome', () => {
  it('keeps the lap of somebody who ran one and calls the rest a plain DNF', () => {
    expect(retireOutcome(TIMER_SESSION, TROILIN_RUNNER_ID)).toBe(TimerRunnerOutcome.lapOnly);
    expect(retireOutcome(TIMER_SESSION, KUZNETSOV_RUNNER_ID)).toBe(TimerRunnerOutcome.dnf);
  });
});
