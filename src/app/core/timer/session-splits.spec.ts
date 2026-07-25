import {
  bestFinishMs,
  finishDoneCount,
  hasDuplicateSurnames,
  isRaceComplete,
  lapDoneCount,
  runnerSplitTimesMs,
  runnerSplits,
  runnerStage,
  runnersWithoutGender,
  unassignedSplits,
} from './session-splits';
import {
  COMPLETE_BY_QUEUE_SESSION,
  COMPLETE_SESSION,
  EXPECTED_BEST_FINISH_MS,
  EXPECTED_FINISH_DONE_COUNT,
  EXPECTED_LAP_DONE_COUNT,
  EXPECTED_RUNNERS_WITHOUT_GENDER,
  EXPECTED_STAGES,
  EXPECTED_TIED_SPLIT_IDS,
  EXPECTED_TROILIN_SPLIT_IDS,
  EXPECTED_TROILIN_SPLIT_TIMES_MS,
  EXPECTED_UNASSIGNED_SPLIT_IDS,
  TIED_SPLITS_SESSION,
  UNIQUE_SURNAME_RUNNERS,
  UNKNOWN_RUNNER_ID,
  YO_SURNAME_RUNNERS,
} from './session-splits.mock';
import {
  KUZNETSOV_RUNNER_ID,
  TIMER_SESSION,
  TIMER_SESSION_RUNNERS,
  TIMER_SESSION_WITHOUT_SPLITS,
  TROILIN_RUNNER_ID,
} from './timer-session.mock';

describe('session splits selectors', () => {
  it('reads a runner`s own taps in time order, keeps the unnamed queue apart and never touches the journal', () => {
    const journal = structuredClone(TIMER_SESSION.splits);

    expect(runnerSplits(TIMER_SESSION, TROILIN_RUNNER_ID).map((split) => split.id)).toEqual(EXPECTED_TROILIN_SPLIT_IDS);
    expect(runnerSplitTimesMs(TIMER_SESSION, TROILIN_RUNNER_ID)).toEqual(EXPECTED_TROILIN_SPLIT_TIMES_MS);
    expect(runnerSplitTimesMs(TIMER_SESSION, KUZNETSOV_RUNNER_ID), 'a runner nobody tapped has no times').toEqual([]);
    expect(runnerSplitTimesMs(TIMER_SESSION, UNKNOWN_RUNNER_ID), 'an unknown id has no times either').toEqual([]);
    expect(unassignedSplits(TIMER_SESSION).map((split) => split.id)).toEqual(EXPECTED_UNASSIGNED_SPLIT_IDS);
    expect(
      unassignedSplits(TIED_SPLITS_SESSION).map((split) => split.id),
      'equal times keep the tap order',
    ).toEqual(EXPECTED_TIED_SPLIT_IDS);
    expect(TIMER_SESSION.splits, 'the journal is only ever read').toEqual(journal);
  });

  it('stages every runner by taps and outcome and counts who is through the lap and the finish', () => {
    const stages = Object.fromEntries(
      [...TIMER_SESSION_RUNNERS.map((runner) => runner.id), UNKNOWN_RUNNER_ID].map((runnerId) => [
        runnerId,
        runnerStage(TIMER_SESSION, runnerId),
      ]),
    );

    expect(stages).toEqual(EXPECTED_STAGES);
    expect(lapDoneCount(TIMER_SESSION)).toBe(EXPECTED_LAP_DONE_COUNT);
    expect(finishDoneCount(TIMER_SESSION)).toBe(EXPECTED_FINISH_DONE_COUNT);
  });

  it('knows when nobody is left to tap and what the fastest 5 km of the race was', () => {
    expect(isRaceComplete(TIMER_SESSION), 'three taps are owed and the queue holds two of them').toBe(false);
    expect(isRaceComplete(TIMER_SESSION_WITHOUT_SPLITS), 'a race nobody has run is not a finished one').toBe(false);
    expect(isRaceComplete(COMPLETE_SESSION), 'everyone is home or retired').toBe(true);
    expect(isRaceComplete(COMPLETE_BY_QUEUE_SESSION), 'the same taps count with no surnames on them').toBe(true);
    expect(bestFinishMs(TIMER_SESSION)).toBe(EXPECTED_BEST_FINISH_MS);
    expect(bestFinishMs(TIMER_SESSION_WITHOUT_SPLITS), 'nobody home, nothing to show').toBeNull();
  });

  it('warns about shared surnames and lists everybody still without a gender', () => {
    expect(hasDuplicateSurnames(TIMER_SESSION_RUNNERS), 'two Поповы are in the roster').toBe(true);
    expect(hasDuplicateSurnames(UNIQUE_SURNAME_RUNNERS), 'without the second Попов the surnames are unique').toBe(false);
    expect(hasDuplicateSurnames(YO_SURNAME_RUNNERS), 'case and «ё» are normalized away').toBe(true);
    expect(runnersWithoutGender(TIMER_SESSION)).toEqual(EXPECTED_RUNNERS_WITHOUT_GENDER);
  });
});
