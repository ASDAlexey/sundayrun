import { LapBoardRow } from './session-lap-board.interface';
import { runnerSplits, unassignedSplits } from './session-splits';
import {
  FINISH_SPLIT_INDEX,
  FIRST_POSITION,
  LAP_DONE_MIN_SPLITS,
  LAP_SPLIT_INDEX,
  LEADER_INDEX,
  MAX_SPLITS_PER_RUNNER,
  NOTHING_RECORDED,
  NO_GAP_MS,
} from './timer-session.constant';
import { TimerRunnerOutcome } from './timer-session.enum';
import { TimerSession, TimerSplit } from './timer-session.interface';

/**
 * The live «Первый круг» table (docs/TIMER.md §4): everyone whose 2.3 km is already timed, fastest
 * first, with the gap to the leader of the lap. Positions are plain 1..N — an equal lap keeps the
 * roster order, exactly like the protocol keeps the input order on a tie. A runner who has not been
 * tapped yet simply is not there, and retiring later does not erase the lap he actually ran.
 *
 * Times still without a name take their places too, as lines with no surname on them. Otherwise the
 * table lies at the worst moment: three people run past, the organiser taps a surname, hits «ОТСЕЧКА»
 * twice and taps the next surname — and the fourth man home is shown second, because the two times in
 * between are nobody's yet. The place is held instead, and the surname drops into it on handout.
 */
export function buildLapBoard(session: TimerSession): LapBoardRow[] {
  const timed: LapBoardRow[] = [];

  for (const runner of session.runners) {
    const splits = runnerSplits(session, runner.id);

    if (splits.length >= LAP_DONE_MIN_SPLITS) {
      timed.push(buildRow(splits[LAP_SPLIT_INDEX], runner.id, runner.fullName));
    }
  }

  for (const split of lapCandidates(session)) {
    timed.push(buildRow(split, null, null));
  }

  const ordered = timed.sort((left, right) => left.lapMs - right.lapMs);

  return ordered.map((row, index) => ({
    ...row,
    position: index + FIRST_POSITION,
    gapMs: row.lapMs - ordered[LEADER_INDEX].lapMs,
  }));
}

/**
 * Which of the queued times the board is allowed to show as laps. Two limits, and both of them are
 * about not inventing a lap that nobody ran:
 *
 * - **as many as there are runners nobody has tapped at all.** A queued time belongs to somebody, and
 *   somebody with an empty journal has nothing ahead of him but the lap. A withdrawn runner holds
 *   nothing: he is not coming round.
 * - **only times recorded before the first 5 km finish.** Once anybody is home, a stray tap is far
 *   likelier to be a finish than a first lap, and a phantom line in the lap table is worse than a
 *   missing one — the chips of the queue are on screen anyway.
 */
function lapCandidates(session: TimerSession): TimerSplit[] {
  const waiting = session.runners.filter(
    (runner) => runner.outcome === TimerRunnerOutcome.active && runnerSplits(session, runner.id).length === NOTHING_RECORDED,
  ).length;

  if (waiting === NOTHING_RECORDED) {
    return [];
  }

  const firstFinishMs = earliestFinishMs(session);

  return unassignedSplits(session)
    .filter((split) => firstFinishMs === null || split.atMs < firstFinishMs)
    .slice(0, waiting);
}

/** When the first 5 km of the race was recorded, or null while everybody is still out there. */
function earliestFinishMs(session: TimerSession): number | null {
  const finishes = session.runners.reduce<number[]>((times, runner) => {
    const splits = runnerSplits(session, runner.id);

    return splits.length < MAX_SPLITS_PER_RUNNER ? times : [...times, splits[FINISH_SPLIT_INDEX].atMs];
  }, []);

  return finishes.length === NOTHING_RECORDED ? null : Math.min(...finishes);
}

function buildRow(split: TimerSplit, runnerId: string | null, fullName: string | null): LapBoardRow {
  return {
    position: FIRST_POSITION,
    splitId: split.id,
    runnerId,
    fullName,
    lapMs: split.atMs,
    gapMs: NO_GAP_MS,
  };
}
