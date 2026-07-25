import { formatDuration } from '../../../core/time/duration';
import { runnerSplitTimesMs, runnerStage } from '../../../core/timer/session-splits';
import { LAST_ENTRY_INDEX } from '../../../core/timer/timer-session.constant';
import { TimerRunner, TimerSession } from '../../../core/timer/timer-session.interface';
import { splitTimerName, tileInkIndex } from './tile-layout';
import { TIMER_TILE_EMPTY_TIME } from './runner-grid.constant';
import { TimerTileView } from './runner-grid.interface';

/**
 * The whole grid as plain view models, in the frozen tile order. Everything a tile shows is decided
 * here, once per session change, so the tiles themselves stay dumb and cheap to re-render. An id
 * whose runner has just been removed from the roster is skipped rather than drawn as a hole.
 */
export function buildTimerTileViews(session: TimerSession, orderedIds: readonly string[], spellGiven: boolean): TimerTileView[] {
  return orderedIds.reduce<TimerTileView[]>((views, id) => {
    const runner = session.runners.find((candidate) => candidate.id === id);

    return runner === undefined ? views : [...views, tileView(session, runner, spellGiven)];
  }, []);
}

/** The newest time of the runner, ready for the tile: «11:08», or nothing at all. */
export function tileTimeText(session: TimerSession, runnerId: string): string {
  const latestMs = runnerSplitTimesMs(session, runnerId).at(LAST_ENTRY_INDEX);

  return latestMs === undefined ? TIMER_TILE_EMPTY_TIME : formatDuration(latestMs);
}

function tileView(session: TimerSession, runner: TimerRunner, spellGiven: boolean): TimerTileView {
  const { givenName, surname } = splitTimerName(runner.fullName, spellGiven);

  return {
    accentIndex: tileInkIndex(runner.fullName),
    givenName,
    runner,
    stage: runnerStage(session, runner.id),
    surname,
    timeText: tileTimeText(session, runner.id),
  };
}
