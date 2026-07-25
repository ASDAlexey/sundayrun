import { LapBoardRow } from './session-lap-board.interface';
import { runnerSplitTimesMs } from './session-splits';
import { FIRST_POSITION, LAP_DONE_MIN_SPLITS, LAP_SPLIT_INDEX, LEADER_INDEX, NO_GAP_MS } from './timer-session.constant';
import { TimerSession } from './timer-session.interface';

/**
 * The live «Первый круг» table (docs/TIMER.md §4): everyone whose 2.3 km is already timed, fastest
 * first, with the gap to the leader of the lap. Positions are plain 1..N — an equal lap keeps the
 * roster order, exactly like the protocol keeps the input order on a tie. A runner who has not been
 * tapped yet simply is not there, and retiring later does not erase the lap he actually ran.
 */
export function buildLapBoard(session: TimerSession): LapBoardRow[] {
  const timed: LapBoardRow[] = [];

  for (const runner of session.runners) {
    const timesMs = runnerSplitTimesMs(session, runner.id);

    if (timesMs.length >= LAP_DONE_MIN_SPLITS) {
      timed.push({
        position: FIRST_POSITION,
        runnerId: runner.id,
        fullName: runner.fullName,
        lapMs: timesMs[LAP_SPLIT_INDEX],
        gapMs: NO_GAP_MS,
      });
    }
  }

  const ordered = timed.sort((left, right) => left.lapMs - right.lapMs);

  return ordered.map((row, index) => ({
    ...row,
    position: index + FIRST_POSITION,
    gapMs: row.lapMs - ordered[LEADER_INDEX].lapMs,
  }));
}
