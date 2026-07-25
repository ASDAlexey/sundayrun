import { normalizeAthleteKey } from '../history/athlete-key';
import {
  EMPTY_ROSTER,
  FINISH_SPLIT_INDEX,
  LAP_DONE_MIN_SPLITS,
  MAX_SPLITS_PER_RUNNER,
  NAME_PART_SEPARATOR,
  NOTHING_RECORDED,
  SURNAME_INDEX,
} from './timer-session.constant';
import { TimerRunnerOutcome, TimerRunnerStage, TimerRunnerStageType } from './timer-session.enum';
import { TimerRunner, TimerSession, TimerSplit } from './timer-session.interface';

/**
 * The taps that belong to one runner, earliest first. The journal keeps taps in the order they
 * were pressed, so two equal times stay in that order — the lap always comes before the finish.
 */
export function runnerSplits(session: TimerSession, runnerId: string): TimerSplit[] {
  return byTimeAscending(session.splits.filter((split) => split.runnerId === runnerId));
}

/** The same taps as plain elapsed times: `[lapMs, finishMs]` for a runner who is done. */
export function runnerSplitTimesMs(session: TimerSession, runnerId: string): number[] {
  return runnerSplits(session, runnerId).map((split) => split.atMs);
}

/** Times recorded with the «Отсечка без имени» button and still waiting for a name, earliest first. */
export function unassignedSplits(session: TimerSession): TimerSplit[] {
  return byTimeAscending(session.splits.filter((split) => split.runnerId === null));
}

/**
 * Where the runner stands right now. A runner who was retired (DNF or «only the lap») is `retired`
 * whatever the journal holds — the organiser's word wins over the tap count. An id that is not in
 * the roster has no tile to colour, so it reports `retired` as well.
 */
export function runnerStage(session: TimerSession, runnerId: string): TimerRunnerStageType {
  const runner = session.runners.find((candidate) => candidate.id === runnerId);

  if (runner === undefined) {
    return TimerRunnerStage.retired;
  }

  return stageOf(runner, runnerSplits(session, runnerId).length);
}

/** How many runners are already through the 2.3 km lap — the left half of «круг: 8 из 15 · финиш: 0». */
export function lapDoneCount(session: TimerSession): number {
  return countRunnersWithSplits(session, LAP_DONE_MIN_SPLITS);
}

/** How many runners are already through the 5 km finish — the right half of the same counter. */
export function finishDoneCount(session: TimerSession): number {
  return countRunnersWithSplits(session, MAX_SPLITS_PER_RUNNER);
}

/**
 * Nobody is left to tap. This is «последний финишировавший» (docs/TIMER.md §10) — the one moment of
 * the race that is allowed an orchestrated animation, and the moment the clock stops itself (§14).
 *
 * It counts **taps, not names**: fifteen people are done at thirty times whether the organiser put a
 * surname on every one of them or hit «ОТСЕЧКА» into the queue. A queued time belongs to somebody,
 * so it covers one of the taps still owed — the race is over when the queue covers every one of them.
 * Waiting for the handout instead would leave the stopwatch running over a finished race for as long
 * as it takes to give out the last surname, which is exactly what it must not do.
 *
 * A retired runner owes nothing: he is not coming round. An empty roster is never it, and neither is
 * a field where nothing was recorded at all.
 */
export function isRaceComplete(session: TimerSession): boolean {
  if (session.runners.length === EMPTY_ROSTER || session.splits.length === NOTHING_RECORDED) {
    return false;
  }

  return tapsOwed(session) <= unassignedSplits(session).length;
}

/**
 * The fastest 5 km of the race so far, or null while nobody is home — «19:24 лучший» of the farewell
 * line. Retired runners are out of it: a `lapOnly` pair of taps is not a finish.
 */
export function bestFinishMs(session: TimerSession): number | null {
  const finishes = session.runners.reduce<number[]>((times, runner) => {
    const split = runnerSplits(session, runner.id)[FINISH_SPLIT_INDEX];

    if (runner.outcome !== TimerRunnerOutcome.active || split === undefined) {
      return times;
    }

    return [...times, split.atMs];
  }, []);

  return finishes.length === 0 ? null : Math.min(...finishes);
}

/**
 * Whether two people in the roster share a surname — then the tiles must spell both first names out
 * in full, and adding the second one warns «в составе уже есть Попов» (docs/TIMER.md §4).
 */
export function hasDuplicateSurnames(runners: readonly TimerRunner[]): boolean {
  const surnames = runners.map((runner) => surnameKey(runner.fullName));

  return new Set(surnames).size !== surnames.length;
}

/** Runners the organiser still has to answer for — a missing gender leaves them out of the places. */
export function runnersWithoutGender(session: TimerSession): TimerRunner[] {
  return session.runners.filter((runner) => runner.gender === null);
}

/** How many taps the field still owes: two per active runner, less whatever he already has. */
function tapsOwed(session: TimerSession): number {
  return session.runners.reduce<number>((owed, runner) => {
    if (runner.outcome !== TimerRunnerOutcome.active) {
      return owed;
    }

    return owed + Math.max(NOTHING_RECORDED, MAX_SPLITS_PER_RUNNER - runnerSplits(session, runner.id).length);
  }, NOTHING_RECORDED);
}

function stageOf(runner: TimerRunner, splitCount: number): TimerRunnerStageType {
  if (runner.outcome !== TimerRunnerOutcome.active) {
    return TimerRunnerStage.retired;
  }

  if (splitCount >= MAX_SPLITS_PER_RUNNER) {
    return TimerRunnerStage.finished;
  }

  return splitCount < LAP_DONE_MIN_SPLITS ? TimerRunnerStage.waitingLap : TimerRunnerStage.waitingFinish;
}

function countRunnersWithSplits(session: TimerSession, minimum: number): number {
  return session.runners.filter((runner) => runnerSplits(session, runner.id).length >= minimum).length;
}

function surnameKey(fullName: string): string {
  return normalizeAthleteKey(fullName).split(NAME_PART_SEPARATOR)[SURNAME_INDEX];
}

function byTimeAscending(splits: TimerSplit[]): TimerSplit[] {
  return splits.sort((left, right) => left.atMs - right.atMs);
}
