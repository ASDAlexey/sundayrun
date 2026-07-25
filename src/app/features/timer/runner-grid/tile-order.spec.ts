import { TIMER_SESSION_RUNNERS } from '../../../core/timer/timer-session.mock';
import { GRID_EXPECTED_LAP_MS, GRID_EXPECTED_ORDER, GRID_FROZEN_ORDER, GRID_STALE_ORDER } from './runner-grid.mock';
import { orderTimerTileIds } from './tile-order';

describe('orderTimerTileIds', () => {
  it('lays the tiles out by expected lap while the order is still open', () => {
    const order = orderTimerTileIds({ expectedLapMs: GRID_EXPECTED_LAP_MS, frozen: false, runners: TIMER_SESSION_RUNNERS }, undefined);

    expect(order).toEqual(GRID_EXPECTED_ORDER);
  });

  it('freezes the order once the clock runs: survivors stay put, latecomers land at the end', () => {
    const frozen = { expectedLapMs: GRID_EXPECTED_LAP_MS, frozen: true, runners: TIMER_SESSION_RUNNERS };

    expect(orderTimerTileIds(frozen, GRID_STALE_ORDER)).toEqual(GRID_FROZEN_ORDER);
    expect(orderTimerTileIds(frozen, undefined), 'with nothing to keep, the roster order is the order').toEqual(
      TIMER_SESSION_RUNNERS.map((runner) => runner.id),
    );
  });
});
