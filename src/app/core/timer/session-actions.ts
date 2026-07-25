import { GenderType } from '../models/gender.enum';
import { CreateSessionInput, NewTimerRunner } from './session-actions.interface';
import { runnerSplits, unassignedSplits } from './session-splits';
import {
  EMPTY_ROSTER,
  INITIAL_PUBLISH_STATUS,
  LAST_ENTRY_INDEX,
  MAX_SPLITS_PER_RUNNER,
  WITHOUT_LAST_ENTRY,
} from './timer-session.constant';
import { TimerRole, TimerRunnerOutcome, TimerRunnerOutcomeType, TimerStatus } from './timer-session.enum';
import { TimerPublishStatus, TimerRunner, TimerSession, TimerSplit } from './timer-session.interface';

/**
 * Pure transitions over a timer session. Every function returns a new session, or the very same
 * reference when the request changes nothing — a rejected tap must not wake a signal up. Nothing
 * here throws and nothing here reads a clock or invents an id: both arrive as arguments.
 */
export function createSession(input: CreateSessionInput): TimerSession {
  return {
    id: input.id,
    dateIso: input.dateIso,
    createdAtMs: input.createdAtMs,
    startedAtEpochMs: null,
    stoppedAtMs: null,
    status: TimerStatus.idle,
    role: input.role ?? TimerRole.main,
    runners: [],
    splits: [],
    publish: { ...INITIAL_PUBLISH_STATUS },
  };
}

/** Appends a runner to the roster; a duplicate id is ignored so a double tap cannot clone a tile. */
export function addRunner(session: TimerSession, runner: NewTimerRunner): TimerSession {
  if (hasRunner(session, runner.id)) {
    return session;
  }

  return { ...session, runners: [...session.runners, { ...runner, outcome: TimerRunnerOutcome.active }] };
}

/**
 * Removes a runner together with his splits. The times go away rather than back into the unnamed
 * queue on purpose: a tile is deleted when the person was added by mistake, so his taps are wrong
 * too. A time that in truth belongs to somebody else is moved with `reassignSplit` first.
 */
export function removeRunner(session: TimerSession, runnerId: string): TimerSession {
  if (!hasRunner(session, runnerId)) {
    return session;
  }

  return {
    ...session,
    runners: session.runners.filter((runner) => runner.id !== runnerId),
    splits: session.splits.filter((split) => split.runnerId !== runnerId),
  };
}

/** Renames a runner, e.g. after the roster sheet matched him against the archive. */
export function renameRunner(session: TimerSession, runnerId: string, fullName: string, athleteKey: string | null): TimerSession {
  return withRunner(session, runnerId, (runner) =>
    runner.fullName === fullName && runner.athleteKey === athleteKey ? runner : { ...runner, fullName, athleteKey },
  );
}

export function setRunnerGender(session: TimerSession, runnerId: string, gender: GenderType | null): TimerSession {
  return withRunner(session, runnerId, (runner) => (runner.gender === gender ? runner : { ...runner, gender }));
}

/** Marks how the race ended for the runner: still running, DNF, or «сошёл после круга». */
export function setRunnerOutcome(session: TimerSession, runnerId: string, outcome: TimerRunnerOutcomeType): TimerSession {
  return withRunner(session, runnerId, (runner) => (runner.outcome === outcome ? runner : { ...runner, outcome }));
}

/**
 * Starts the mass start; the epoch stamp is kept only to know the date, never for split maths.
 *
 * A race with an empty roster is refused here rather than in the screen: the rule then holds for
 * every entrance — a restored session, a second judge's device, whatever comes next — and cannot be
 * walked around. A clock running over nobody can only ever produce an empty protocol.
 */
export function startSession(session: TimerSession, startedAtEpochMs: number): TimerSession {
  if (session.status !== TimerStatus.idle || session.runners.length === EMPTY_ROSTER) {
    return session;
  }

  return { ...session, status: TimerStatus.running, startedAtEpochMs };
}

/** Stops the clock and remembers the elapsed time it showed. */
export function stopSession(session: TimerSession, elapsedMs: number): TimerSession {
  return session.status === TimerStatus.running ? { ...session, status: TimerStatus.finished, stoppedAtMs: elapsedMs } : session;
}

/**
 * Records a tap on a runner's tile: the first one is his 2.3 km lap, the second his 5 km finish.
 * Refused while the clock is not running, for an unknown or retired runner, and once he is done.
 */
export function recordSplit(session: TimerSession, runnerId: string, atMs: number, splitId: string): TimerSession {
  const runner = session.runners.find((candidate) => candidate.id === runnerId);

  if (session.status !== TimerStatus.running || runner === undefined) {
    return session;
  }

  if (runner.outcome !== TimerRunnerOutcome.active || isRunnerDone(session, runnerId)) {
    return session;
  }

  return { ...session, splits: [...session.splits, { id: splitId, atMs, runnerId }] };
}

/** Records a time with no name attached — the pack-of-three safety net (docs/TIMER.md §4). */
export function recordUnnamedSplit(session: TimerSession, atMs: number, splitId: string): TimerSession {
  if (session.status !== TimerStatus.running) {
    return session;
  }

  return { ...session, splits: [...session.splits, { id: splitId, atMs, runnerId: null }] };
}

/** Gives a queued unnamed time to a runner; a time that already has an owner needs `reassignSplit`. */
export function assignSplit(session: TimerSession, splitId: string, runnerId: string): TimerSession {
  const split = findSplit(session, splitId);

  if (split === undefined) {
    return session;
  }

  return split.runnerId === null ? withSplitOwner(session, split, runnerId) : session;
}

/** «Раздача очереди по порядку»: the earliest unnamed time goes to the runner just tapped. */
export function assignNextUnnamed(session: TimerSession, runnerId: string): TimerSession {
  const [next] = unassignedSplits(session);

  return next === undefined ? session : withSplitOwner(session, next, runnerId);
}

/** Moves a time to another runner — «тапнул не того», one time at a time. */
export function reassignSplit(session: TimerSession, splitId: string, runnerId: string): TimerSession {
  const split = findSplit(session, splitId);

  return split === undefined ? session : withSplitOwner(session, split, runnerId);
}

/** Sends a time back to the unnamed queue. */
export function unassignSplit(session: TimerSession, splitId: string): TimerSession {
  const split = findSplit(session, splitId);

  if (split === undefined) {
    return session;
  }

  return split.runnerId === null ? session : replaceSplitOwner(session, split, null);
}

/** «Тапнул не того» wholesale: both runners exchange every time recorded for them. */
export function swapRunnerSplits(session: TimerSession, leftRunnerId: string, rightRunnerId: string): TimerSession {
  const touched = session.splits.some((split) => split.runnerId === leftRunnerId || split.runnerId === rightRunnerId);

  if (leftRunnerId === rightRunnerId || !hasRunner(session, leftRunnerId) || !hasRunner(session, rightRunnerId) || !touched) {
    return session;
  }

  return { ...session, splits: session.splits.map((split) => swapOwner(split, leftRunnerId, rightRunnerId)) };
}

/** Throws a time away completely — for the tap that was pure noise. */
export function removeSplit(session: TimerSession, splitId: string): TimerSession {
  const split = findSplit(session, splitId);

  return split === undefined ? session : { ...session, splits: session.splits.filter((candidate) => candidate !== split) };
}

/** The header's «Отменить»: drops the newest journal entry, named or not. */
export function undoLastSplit(session: TimerSession): TimerSession {
  return session.splits.length === 0 ? session : { ...session, splits: session.splits.slice(0, WITHOUT_LAST_ENTRY) };
}

/** «+ ещё один»: hangs the newest recorded time on one more runner — they came in chest to chest. */
export function repeatLastSplitFor(session: TimerSession, runnerId: string, splitId: string): TimerSession {
  const last = session.splits.at(LAST_ENTRY_INDEX);

  return last === undefined ? session : recordSplit(session, runnerId, last.atMs, splitId);
}

/** Records the outcome of a publish attempt; an identical status keeps the session reference. */
export function setPublishStatus(session: TimerSession, publish: TimerPublishStatus): TimerSession {
  const current = session.publish;

  if (current.state === publish.state && current.error === publish.error && current.sha === publish.sha) {
    return session;
  }

  return { ...session, publish };
}

function withRunner(session: TimerSession, runnerId: string, patch: (runner: TimerRunner) => TimerRunner): TimerSession {
  const runner = session.runners.find((candidate) => candidate.id === runnerId);

  if (runner === undefined) {
    return session;
  }

  const patched = patch(runner);

  return patched === runner ? session : { ...session, runners: session.runners.map((item) => (item === runner ? patched : item)) };
}

/** Hands a time over, unless the target is unknown, already holds it, or is already done. */
function withSplitOwner(session: TimerSession, split: TimerSplit, runnerId: string): TimerSession {
  if (!hasRunner(session, runnerId) || split.runnerId === runnerId || isRunnerDone(session, runnerId)) {
    return session;
  }

  return replaceSplitOwner(session, split, runnerId);
}

function replaceSplitOwner(session: TimerSession, split: TimerSplit, runnerId: string | null): TimerSession {
  return { ...session, splits: session.splits.map((item) => (item === split ? { ...item, runnerId } : item)) };
}

function swapOwner(split: TimerSplit, leftRunnerId: string, rightRunnerId: string): TimerSplit {
  if (split.runnerId === leftRunnerId) {
    return { ...split, runnerId: rightRunnerId };
  }

  return split.runnerId === rightRunnerId ? { ...split, runnerId: leftRunnerId } : split;
}

function findSplit(session: TimerSession, splitId: string): TimerSplit | undefined {
  return session.splits.find((split) => split.id === splitId);
}

function hasRunner(session: TimerSession, runnerId: string): boolean {
  return session.runners.some((runner) => runner.id === runnerId);
}

function isRunnerDone(session: TimerSession, runnerId: string): boolean {
  return runnerSplits(session, runnerId).length >= MAX_SPLITS_PER_RUNNER;
}
