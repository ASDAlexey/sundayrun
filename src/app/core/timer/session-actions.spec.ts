import { Gender } from '../models/gender.enum';
import {
  addRunner,
  assignNextUnnamed,
  createSession,
  reassignSplit,
  recordSplit,
  recordUnnamedSplit,
  removeRunner,
  removeSplit,
  renameRunner,
  resumeSession,
  setPublishStatus,
  setRunnerGender,
  setRunnerOutcome,
  startSession,
  stopSession,
  swapRunnerSplits,
  unassignSplit,
  undoLastSplit,
} from './session-actions';
import {
  BACKUP_SESSION_INPUT,
  CORRECTED_ATHLETE_KEY,
  CORRECTED_FULL_NAME,
  CREATE_SESSION_INPUT,
  DUPLICATE_RUNNER,
  EMPTY_ROSTER_SESSION,
  ERROR_ONLY_PUBLISH_STATUS,
  EXPECTED_ADDED_RUNNER,
  EXPECTED_CREATED_SESSION,
  FAILED_PUBLISH_STATUS,
  NEW_RUNNER,
  RECORDED_SPLIT_AT_MS,
  RECORDED_SPLIT_ID,
  SAME_PUBLISH_STATUS,
  SHA_ONLY_PUBLISH_STATUS,
  START_EPOCH_MS,
  STOP_ELAPSED_MS,
  UNKNOWN_SPLIT_ID,
} from './session-actions.mock';
import { runnerSplitTimesMs, runnerSplits, unassignedSplits } from './session-splits';
import { UNKNOWN_RUNNER_ID } from './session-splits.mock';
import { TimerRole, TimerRunnerOutcome, TimerStatus } from './timer-session.enum';
import {
  FIRST_UNNAMED_SPLIT_ID,
  IVANOV_LAP_SPLIT_ID,
  IVANOV_RUNNER_ID,
  KUZNETSOV_RUNNER_ID,
  POPOV_IGOR_LAP_SPLIT_ID,
  POPOV_IGOR_RUNNER_ID,
  ROMANENKO_RUNNER_ID,
  SECOND_UNNAMED_SPLIT_ID,
  SOKOLOVA_RUNNER_ID,
  TIMER_SESSION,
  TIMER_SESSION_IDLE,
  TIMER_SESSION_STALE_QUEUE,
  TIMER_SESSION_WITHOUT_SPLITS,
  TROILIN_RUNNER_ID,
} from './timer-session.mock';

describe('createSession', () => {
  it('opens an idle session with an empty journal and the main role unless another one is asked for', () => {
    expect(createSession(CREATE_SESSION_INPUT)).toEqual(EXPECTED_CREATED_SESSION);
    expect(createSession(BACKUP_SESSION_INPUT).role, 'the second judge gets his own role').toBe(TimerRole.backup);
  });
});

describe('roster actions', () => {
  it('adds, renames, re-genders, retires and removes runners, and keeps the reference when nothing changes', () => {
    const withRunner = addRunner(TIMER_SESSION_IDLE, NEW_RUNNER);
    const renamed = renameRunner(TIMER_SESSION, TROILIN_RUNNER_ID, CORRECTED_FULL_NAME, CORRECTED_ATHLETE_KEY);
    const regendered = setRunnerGender(TIMER_SESSION, SOKOLOVA_RUNNER_ID, Gender.female);
    const retired = setRunnerOutcome(TIMER_SESSION, KUZNETSOV_RUNNER_ID, TimerRunnerOutcome.dnf);
    const withoutTroilin = removeRunner(TIMER_SESSION, TROILIN_RUNNER_ID);

    expect(withRunner.runners.at(-1)).toEqual(EXPECTED_ADDED_RUNNER);
    expect(addRunner(withRunner, DUPLICATE_RUNNER), 'a known id is ignored').toBe(withRunner);
    expect(renamed.runners[0]).toEqual({ ...TIMER_SESSION.runners[0], fullName: CORRECTED_FULL_NAME, athleteKey: CORRECTED_ATHLETE_KEY });
    expect(renamed.runners[1], 'untouched runners are shared').toBe(TIMER_SESSION.runners[1]);
    expect(renameRunner(TIMER_SESSION, TROILIN_RUNNER_ID, TIMER_SESSION.runners[0].fullName, TIMER_SESSION.runners[0].athleteKey)).toBe(
      TIMER_SESSION,
    );
    expect(renameRunner(TIMER_SESSION, UNKNOWN_RUNNER_ID, CORRECTED_FULL_NAME, null), 'an unknown id is a no-op').toBe(TIMER_SESSION);
    expect(regendered.runners[4].gender).toBe(Gender.female);
    expect(setRunnerGender(TIMER_SESSION, TROILIN_RUNNER_ID, Gender.male), 'the same gender changes nothing').toBe(TIMER_SESSION);
    expect(retired.runners[6].outcome).toBe(TimerRunnerOutcome.dnf);
    expect(setRunnerOutcome(TIMER_SESSION, IVANOV_RUNNER_ID, TimerRunnerOutcome.dnf), 'the same outcome changes nothing').toBe(
      TIMER_SESSION,
    );
    expect(withoutTroilin.runners.map((runner) => runner.id)).not.toContain(TROILIN_RUNNER_ID);
    expect(withoutTroilin.splits, 'his times go away with him').toHaveLength(TIMER_SESSION.splits.length - 2);
    expect(removeRunner(TIMER_SESSION, UNKNOWN_RUNNER_ID)).toBe(TIMER_SESSION);
  });
});

describe('clock actions', () => {
  it('starts only from idle and stops only while running', () => {
    const started = startSession(TIMER_SESSION_IDLE, START_EPOCH_MS);
    const stopped = stopSession(TIMER_SESSION, STOP_ELAPSED_MS);

    expect(started.status).toBe(TimerStatus.running);
    expect(started.startedAtEpochMs).toBe(START_EPOCH_MS);
    expect(startSession(TIMER_SESSION, START_EPOCH_MS), 'a running race is not restarted').toBe(TIMER_SESSION);
    expect(startSession(EMPTY_ROSTER_SESSION, START_EPOCH_MS), 'and a race nobody is running never starts at all').toBe(
      EMPTY_ROSTER_SESSION,
    );
    expect(stopped.status).toBe(TimerStatus.finished);
    expect(stopped.stoppedAtMs).toBe(STOP_ELAPSED_MS);
    expect(stopSession(TIMER_SESSION_IDLE, STOP_ELAPSED_MS), 'a race that never started cannot be stopped').toBe(TIMER_SESSION_IDLE);

    const resumed = resumeSession(stopped);

    expect(resumed.status, 'the automatic stop is undoable — the race goes back on the clock').toBe(TimerStatus.running);
    expect(resumed.stoppedAtMs).toBeNull();
    expect(resumed.startedAtEpochMs, 'and the digits resume where the wall clock says they should').toBe(stopped.startedAtEpochMs);
    expect(resumeSession(TIMER_SESSION), 'a race already running is left alone').toBe(TIMER_SESSION);
    expect(resumeSession(TIMER_SESSION_IDLE), 'and one that never started has nothing to resume').toBe(TIMER_SESSION_IDLE);
  });
});

describe('recording actions', () => {
  it('records named and unnamed taps only while the clock runs, and undoes the newest entry', () => {
    const recorded = recordSplit(TIMER_SESSION, KUZNETSOV_RUNNER_ID, RECORDED_SPLIT_AT_MS, RECORDED_SPLIT_ID);
    const unnamed = recordUnnamedSplit(TIMER_SESSION, RECORDED_SPLIT_AT_MS, RECORDED_SPLIT_ID);

    expect(recorded.splits.at(-1)).toEqual({ id: RECORDED_SPLIT_ID, atMs: RECORDED_SPLIT_AT_MS, runnerId: KUZNETSOV_RUNNER_ID });
    expect(recordSplit(TIMER_SESSION_IDLE, KUZNETSOV_RUNNER_ID, RECORDED_SPLIT_AT_MS, RECORDED_SPLIT_ID), 'the clock must run').toBe(
      TIMER_SESSION_IDLE,
    );
    expect(recordSplit(TIMER_SESSION, UNKNOWN_RUNNER_ID, RECORDED_SPLIT_AT_MS, RECORDED_SPLIT_ID), 'an unknown runner').toBe(TIMER_SESSION);
    expect(recordSplit(TIMER_SESSION, IVANOV_RUNNER_ID, RECORDED_SPLIT_AT_MS, RECORDED_SPLIT_ID), 'a retired runner').toBe(TIMER_SESSION);
    expect(recordSplit(TIMER_SESSION, TROILIN_RUNNER_ID, RECORDED_SPLIT_AT_MS, RECORDED_SPLIT_ID), 'a runner already done').toBe(
      TIMER_SESSION,
    );
    expect(unnamed.splits.at(-1)).toEqual({ id: RECORDED_SPLIT_ID, atMs: RECORDED_SPLIT_AT_MS, runnerId: null });
    expect(recordUnnamedSplit(TIMER_SESSION_IDLE, RECORDED_SPLIT_AT_MS, RECORDED_SPLIT_ID), 'the clock must run here too').toBe(
      TIMER_SESSION_IDLE,
    );
    expect(undoLastSplit(TIMER_SESSION).splits).toEqual(TIMER_SESSION.splits.slice(0, -1));
    expect(undoLastSplit(TIMER_SESSION_WITHOUT_SPLITS), 'nothing to undo').toBe(TIMER_SESSION_WITHOUT_SPLITS);
  });
});

describe('queue actions', () => {
  it('hands unnamed times out in order, moves a time between runners, frees it and throws it away', () => {
    const fromQueue = assignNextUnnamed(TIMER_SESSION, KUZNETSOV_RUNNER_ID);
    const finishFromQueue = assignNextUnnamed(TIMER_SESSION, POPOV_IGOR_RUNNER_ID);
    const moved = reassignSplit(TIMER_SESSION, IVANOV_LAP_SPLIT_ID, KUZNETSOV_RUNNER_ID);
    const freed = unassignSplit(TIMER_SESSION, IVANOV_LAP_SPLIT_ID);

    expect(
      runnerSplits(fromQueue, KUZNETSOV_RUNNER_ID).map((split) => split.id),
      'the earliest queued time goes first',
    ).toEqual([FIRST_UNNAMED_SPLIT_ID]);
    expect(
      runnerSplits(finishFromQueue, POPOV_IGOR_RUNNER_ID).map((split) => split.id),
      'and a finish is taken from the same queue, after his own lap',
    ).toEqual([POPOV_IGOR_LAP_SPLIT_ID, FIRST_UNNAMED_SPLIT_ID]);
    expect(
      assignNextUnnamed(TIMER_SESSION_STALE_QUEUE, POPOV_IGOR_RUNNER_ID),
      'a queued time before his lap is somebody else’s tap, not his finish',
    ).toBe(TIMER_SESSION_STALE_QUEUE);
    expect(assignNextUnnamed(TIMER_SESSION, TROILIN_RUNNER_ID), 'a runner who already has both times').toBe(TIMER_SESSION);
    expect(assignNextUnnamed(TIMER_SESSION, UNKNOWN_RUNNER_ID), 'an unknown runner').toBe(TIMER_SESSION);
    expect(assignNextUnnamed(TIMER_SESSION_WITHOUT_SPLITS, KUZNETSOV_RUNNER_ID), 'an empty queue').toBe(TIMER_SESSION_WITHOUT_SPLITS);
    expect(runnerSplits(moved, KUZNETSOV_RUNNER_ID).map((split) => split.id)).toEqual([IVANOV_LAP_SPLIT_ID]);
    expect(runnerSplits(moved, IVANOV_RUNNER_ID), 'the old owner loses it').toEqual([]);
    expect(reassignSplit(TIMER_SESSION, UNKNOWN_SPLIT_ID, KUZNETSOV_RUNNER_ID), 'an unknown time').toBe(TIMER_SESSION);
    expect(reassignSplit(TIMER_SESSION, IVANOV_LAP_SPLIT_ID, IVANOV_RUNNER_ID), 'the owner it already has').toBe(TIMER_SESSION);
    expect(
      unassignedSplits(freed).map((split) => split.id),
      'a freed time joins the queue in time order',
    ).toEqual([IVANOV_LAP_SPLIT_ID, FIRST_UNNAMED_SPLIT_ID, SECOND_UNNAMED_SPLIT_ID]);
    expect(unassignSplit(TIMER_SESSION, FIRST_UNNAMED_SPLIT_ID), 'a time already in the queue').toBe(TIMER_SESSION);
    expect(unassignSplit(TIMER_SESSION, UNKNOWN_SPLIT_ID), 'an unknown time').toBe(TIMER_SESSION);
    expect(removeSplit(TIMER_SESSION, IVANOV_LAP_SPLIT_ID).splits, 'a discarded tap leaves no trace').toHaveLength(
      TIMER_SESSION.splits.length - 1,
    );
    expect(removeSplit(TIMER_SESSION, UNKNOWN_SPLIT_ID), 'an unknown time').toBe(TIMER_SESSION);
  });
});

describe('swapRunnerSplits', () => {
  it('exchanges every time of two runners and refuses a swap that could not mean anything', () => {
    const swapped = swapRunnerSplits(TIMER_SESSION, TROILIN_RUNNER_ID, POPOV_IGOR_RUNNER_ID);

    expect(runnerSplitTimesMs(swapped, TROILIN_RUNNER_ID)).toEqual(runnerSplitTimesMs(TIMER_SESSION, POPOV_IGOR_RUNNER_ID));
    expect(runnerSplitTimesMs(swapped, POPOV_IGOR_RUNNER_ID)).toEqual(runnerSplitTimesMs(TIMER_SESSION, TROILIN_RUNNER_ID));
    expect(swapRunnerSplits(TIMER_SESSION, TROILIN_RUNNER_ID, TROILIN_RUNNER_ID), 'a runner with himself').toBe(TIMER_SESSION);
    expect(swapRunnerSplits(TIMER_SESSION, UNKNOWN_RUNNER_ID, TROILIN_RUNNER_ID), 'an unknown runner on the left').toBe(TIMER_SESSION);
    expect(swapRunnerSplits(TIMER_SESSION, TROILIN_RUNNER_ID, UNKNOWN_RUNNER_ID), 'an unknown runner on the right').toBe(TIMER_SESSION);
    expect(
      swapRunnerSplits(TIMER_SESSION_WITHOUT_SPLITS, KUZNETSOV_RUNNER_ID, ROMANENKO_RUNNER_ID),
      'two runners without a single time between them',
    ).toBe(TIMER_SESSION_WITHOUT_SPLITS);
  });
});

describe('setPublishStatus', () => {
  it('stores every field of the publish outcome and keeps the reference for an identical status', () => {
    expect(setPublishStatus(TIMER_SESSION, FAILED_PUBLISH_STATUS).publish).toEqual(FAILED_PUBLISH_STATUS);
    expect(setPublishStatus(TIMER_SESSION, ERROR_ONLY_PUBLISH_STATUS).publish, 'a new error alone counts').toEqual(
      ERROR_ONLY_PUBLISH_STATUS,
    );
    expect(setPublishStatus(TIMER_SESSION, SHA_ONLY_PUBLISH_STATUS).publish, 'a new commit alone counts').toEqual(SHA_ONLY_PUBLISH_STATUS);
    expect(setPublishStatus(TIMER_SESSION, SAME_PUBLISH_STATUS), 'the very same status').toBe(TIMER_SESSION);
  });
});
