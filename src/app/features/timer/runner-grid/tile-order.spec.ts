import { TIMER_SESSION_RUNNERS } from '../../../core/timer/timer-session.mock';
import { GRID_EXPECTED_LAP_MS, GRID_EXPECTED_ORDER, GRID_FROZEN_ORDER, GRID_STALE_ORDER } from './runner-grid.mock';
import { orderTimerTileIds } from './tile-order';

describe('orderTimerTileIds', () => {
  it('lays the tiles out by expected lap while the order is still open', () => {
    const order = orderTimerTileIds({ expectedLapMs: GRID_EXPECTED_LAP_MS, runners: TIMER_SESSION_RUNNERS }, []);

    expect(order).toEqual(GRID_EXPECTED_ORDER);
  });

  it('keeps the order the measurement carries: survivors stay put, latecomers land at the end', () => {
    const source = { expectedLapMs: GRID_EXPECTED_LAP_MS, runners: TIMER_SESSION_RUNNERS };

    expect(orderTimerTileIds(source, GRID_STALE_ORDER)).toEqual(GRID_FROZEN_ORDER);
    expect(
      orderTimerTileIds({ ...source, expectedLapMs: new Map() }, GRID_STALE_ORDER),
      'an archive that refreshed itself mid-race moves nothing',
    ).toEqual(GRID_FROZEN_ORDER);
  });
});
