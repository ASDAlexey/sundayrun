import { orderRunnersByExpectedLap } from '../../../core/timer/runner-order';
import { TimerTileOrderSource } from './runner-grid.interface';

/**
 * Tile ids in the order the grid draws them. While the order is still open it is recomputed from the
 * archive — fastest expected lap first, newcomers last — so the pack arrives roughly top-down. Once
 * the measurement carries an order of its own (the mass start fixed it, or a drag before it) that one
 * stands: rebuilding the grid while a finger is already on its way means a split recorded for the
 * wrong person (docs/TIMER.md §4). Whoever joins late lands at the end, whoever left the roster drops
 * out, and nobody else moves.
 *
 * The fixed order arrives from the session rather than from the previous render on purpose: the grid
 * is destroyed and rebuilt by every switch to «Круг», by the runner's card, and by a backgrounded tab
 * the browser evicted — and each of those rebuilds used to lay the tiles out from scratch.
 */
export function orderTimerTileIds(source: TimerTileOrderSource, fixedIds: readonly string[]): string[] {
  if (fixedIds.length === 0) {
    return orderRunnersByExpectedLap(source.runners, source.expectedLapMs).map((runner) => runner.id);
  }

  const present = new Set(source.runners.map((runner) => runner.id));
  const kept = fixedIds.filter((id) => present.has(id));
  const known = new Set(kept);

  return [...kept, ...source.runners.flatMap((runner) => (known.has(runner.id) ? [] : [runner.id]))];
}
