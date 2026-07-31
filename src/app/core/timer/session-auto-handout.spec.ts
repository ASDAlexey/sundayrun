import { handOutSoleLapSplit } from './session-auto-handout';
import { runnerSplitTimesMs } from './session-splits';
import {
  FIRST_UNNAMED_SPLIT_MS,
  KUZNETSOV_RUNNER_ID,
  TIMER_SESSION,
  TIMER_SESSION_LAP_COMPLETE,
  TIMER_SESSION_ONLY_QUEUE,
  TIMER_SESSION_WITHOUT_SPLITS,
} from './timer-session.mock';

describe('handOutSoleLapSplit', () => {
  it('gives the earliest queued time to the one man still out on the lap', () => {
    const settled = handOutSoleLapSplit(TIMER_SESSION);

    expect(runnerSplitTimesMs(settled, KUZNETSOV_RUNNER_ID)).toEqual([FIRST_UNNAMED_SPLIT_MS]);
  });

  it('keeps its hands off a queue that could belong to more than one runner', () => {
    expect(handOutSoleLapSplit(TIMER_SESSION_ONLY_QUEUE), 'the whole field is still out on the lap').toBe(TIMER_SESSION_ONLY_QUEUE);

    expect(handOutSoleLapSplit(TIMER_SESSION_LAP_COMPLETE), 'everybody is round, so the queue is finishes').toBe(
      TIMER_SESSION_LAP_COMPLETE,
    );

    expect(handOutSoleLapSplit(TIMER_SESSION_WITHOUT_SPLITS), 'nothing is queued to hand out').toBe(TIMER_SESSION_WITHOUT_SPLITS);
  });
});
