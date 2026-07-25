import { orderRunnersByExpectedLap } from '../../../core/timer/runner-order';
import { TimerTileOrderSource } from './runner-grid.interface';

/**
 * Tile ids in the order the grid draws them. Before the start the order is recomputed from the
 * archive — fastest expected lap first, newcomers last — so the pack arrives roughly top-down. The
 * moment the clock runs the order freezes: rebuilding the grid while a finger is already on its way
 * means a split recorded for the wrong person (docs/TIMER.md §4). Whoever joins late lands at the
 * end, whoever left the roster drops out, and nobody else moves.
 */
export function orderTimerTileIds(source: TimerTileOrderSource, previousIds: readonly string[] | undefined): string[] {
  if (!source.frozen) {
    return orderRunnersByExpectedLap(source.runners, source.expectedLapMs).map((runner) => runner.id);
  }

  const present = new Set(source.runners.map((runner) => runner.id));
  const kept = (previousIds ?? []).filter((id) => present.has(id));
  const known = new Set(kept);

  return [...kept, ...source.runners.flatMap((runner) => (known.has(runner.id) ? [] : [runner.id]))];
}
