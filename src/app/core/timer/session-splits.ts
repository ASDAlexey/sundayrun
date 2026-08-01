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
 * The journal grouped by the runner each tap belongs to, every group earliest first and the unnamed
 * queue under `null` — exactly the lists `runnerSplits` and `unassignedSplits` hand out, only built
 * in one walk of the journal instead of one filter-and-sort per question asked.
 *
 * The groups are read-only because they are shared: everyone holding the index reads the same arrays
 * for as long as it lives, so nothing may sort or trim one in place. The type says so out loud.
 */
export type SplitsByRunner = ReadonlyMap<string | null, readonly TimerSplit[]>;

/**
 * Group the whole journal once, for a pass that is going to ask about every runner in turn — the
 * counters below, `buildLapBoard` and `buildTimerTileViews`. Scanning the journal per runner is fine
 * for a single lookup and quadratic for a field of a hundred, which is where the counters live: one
 * tap redraws the clock, the grid and the lap table together.
 *
 * Build it, use it, drop it. It is a scratch value of one calculation and deliberately not a cache:
 * a session is a new object on every edit, and an index outliving its session would answer with the
 * taps of the race as it used to be.
 */
export function indexSplitsByRunner(session: TimerSession): SplitsByRunner {
  const grouped = new Map<string | null, TimerSplit[]>();

  for (const split of session.splits) {
    const own = grouped.get(split.runnerId) ?? [];

    own.push(split);
    grouped.set(split.runnerId, own);
  }

  for (const own of grouped.values()) {
    byTimeAscending(own);
  }

  return grouped;
}

/**
 * The taps that belong to one runner, earliest first. The journal keeps taps in the order they
 * were pressed, so two equal times stay in that order — the lap always comes before the finish.
 *
 * `index` is the shortcut for a caller walking the whole roster: hand over the map
 * `indexSplitsByRunner` built and the answer is a lookup rather than another walk of the journal.
 */
export function runnerSplits(session: TimerSession, runnerId: string, index?: SplitsByRunner): readonly TimerSplit[] {
  return splitsOf(session, runnerId, index);
}

/** The same taps as plain elapsed times: `[lapMs, finishMs]` for a runner who is done. */
export function runnerSplitTimesMs(session: TimerSession, runnerId: string, index?: SplitsByRunner): number[] {
  return runnerSplits(session, runnerId, index).map((split) => split.atMs);
}

/** Times recorded with the «Отсечка без имени» button and still waiting for a name, earliest first. */
export function unassignedSplits(session: TimerSession, index?: SplitsByRunner): readonly TimerSplit[] {
  return splitsOf(session, null, index);
}

/**
 * The queued time this runner would take: the earliest nameless tap that can be his. Laps and
 * finishes wait in the same queue, so «the earliest one» alone is not enough — a finish has to come
 * after his own lap. A time before it is not a slow lap, it is somebody else's tap, and handing it
 * over would write a finish that happened before the man went round.
 */
export function nextSplitForRunner(session: TimerSession, runnerId: string): TimerSplit | undefined {
  const own = runnerSplits(session, runnerId);
  const last = own[own.length - 1];

  return unassignedSplits(session).find((split) => last === undefined || split.atMs > last.atMs);
}

/**
 * Where the runner stands right now. A runner who was retired (DNF or «only the lap») is `retired`
 * whatever the journal holds — the organiser's word wins over the tap count. An id that is not in
 * the roster has no tile to colour, so it reports `retired` as well.
 */
export function runnerStage(session: TimerSession, runnerId: string, index?: SplitsByRunner): TimerRunnerStageType {
  const runner = session.runners.find((candidate) => candidate.id === runnerId);

  if (runner === undefined) {
    return TimerRunnerStage.retired;
  }

  return stageOf(runner, runnerSplits(session, runnerId, index).length);
}

/**
 * How many runners are already through the 2.3 km lap — the left half of «круг: 8 из 15 · финиш: 0».
 *
 * Counted in taps rather than in names: a time in the queue belongs to somebody, so while people are
 * still out on the lap the nameless taps are their laps. The counter answers «сколько прошло круг»,
 * and four people have gone round whether the surnames are on the times yet or not.
 */
export function lapDoneCount(session: TimerSession): number {
  const index = indexSplitsByRunner(session);

  return countRunnersWithSplits(session, LAP_DONE_MIN_SPLITS, index) + queuedLapCount(session, index);
}

/** How many runners are already through the 5 km finish — the right half, by the same rule. */
export function finishDoneCount(session: TimerSession): number {
  const index = indexSplitsByRunner(session);
  const queued = ownSplits(index, null).length - queuedLapCount(session, index);
  const named = countRunnersWithSplits(session, MAX_SPLITS_PER_RUNNER, index);

  return named + Math.min(queued, owedFinishCount(session, index));
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

  const index = indexSplitsByRunner(session);

  return tapsOwed(session, index) <= ownSplits(index, null).length;
}

/**
 * The fastest 5 km of the race so far, or null while nobody is home — «19:24 лучший» of the farewell
 * line. Retired runners are out of it: a `lapOnly` pair of taps is not a finish.
 */
export function bestFinishMs(session: TimerSession): number | null {
  const index = indexSplitsByRunner(session);
  const finishes = session.runners.reduce<number[]>((times, runner) => {
    const split = ownSplits(index, runner.id)[FINISH_SPLIT_INDEX];

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

/** One group of the journal: read off the index when the caller built one, scanned out when not. */
function splitsOf(session: TimerSession, runnerId: string | null, index: SplitsByRunner | undefined): readonly TimerSplit[] {
  if (index !== undefined) {
    return ownSplits(index, runnerId);
  }

  return byTimeAscending(session.splits.filter((split) => split.runnerId === runnerId));
}

/** What the index holds against one key — an empty list for somebody nobody has tapped. */
function ownSplits(index: SplitsByRunner, runnerId: string | null): readonly TimerSplit[] {
  return index.get(runnerId) ?? [];
}

/** How many taps the field still owes: two per active runner, less whatever he already has. */
function tapsOwed(session: TimerSession, index: SplitsByRunner): number {
  return session.runners.reduce<number>((owed, runner) => {
    if (runner.outcome !== TimerRunnerOutcome.active) {
      return owed;
    }

    return owed + Math.max(NOTHING_RECORDED, MAX_SPLITS_PER_RUNNER - ownSplits(index, runner.id).length);
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

function countRunnersWithSplits(session: TimerSession, minimum: number, index: SplitsByRunner): number {
  return session.runners.filter((runner) => ownSplits(index, runner.id).length >= minimum).length;
}

/** How much of the queue can only be laps: nobody can be given a second tap before their first. */
function queuedLapCount(session: TimerSession, index: SplitsByRunner): number {
  return Math.min(ownSplits(index, null).length, activeRunnersWithSplits(session, NOTHING_RECORDED, index));
}

/** Whom a queued time could still finish: those with a lap, plus those the queue is about to give one. */
function owedFinishCount(session: TimerSession, index: SplitsByRunner): number {
  return activeRunnersWithSplits(session, LAP_DONE_MIN_SPLITS, index) + queuedLapCount(session, index);
}

/** Active runners holding exactly this many taps — a retired one owes nothing, he is not coming round. */
function activeRunnersWithSplits(session: TimerSession, count: number, index: SplitsByRunner): number {
  return session.runners.filter((runner) => runner.outcome === TimerRunnerOutcome.active && ownSplits(index, runner.id).length === count)
    .length;
}

function surnameKey(fullName: string): string {
  return normalizeAthleteKey(fullName).split(NAME_PART_SEPARATOR)[SURNAME_INDEX];
}

function byTimeAscending(splits: TimerSplit[]): TimerSplit[] {
  return splits.sort((left, right) => left.atMs - right.atMs);
}
