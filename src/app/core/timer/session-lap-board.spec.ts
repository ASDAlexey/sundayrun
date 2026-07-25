import { buildLapBoard } from './session-lap-board';
import { EXPECTED_LAP_BOARD, EXPECTED_TIED_LAP_BOARD_IDS, TIED_LAP_BOARD_SESSION } from './session-lap-board.mock';
import { TIMER_SESSION, TIMER_SESSION_WITHOUT_SPLITS } from './timer-session.mock';

describe('buildLapBoard', () => {
  it('ranks every timed lap by time with the gap to the leader and keeps equal laps in roster order', () => {
    expect(buildLapBoard(TIMER_SESSION)).toEqual(EXPECTED_LAP_BOARD);
    expect(buildLapBoard(TIED_LAP_BOARD_SESSION).map((row) => row.runnerId)).toEqual(EXPECTED_TIED_LAP_BOARD_IDS);
    expect(buildLapBoard(TIMER_SESSION_WITHOUT_SPLITS), 'before the first tap the board is empty').toEqual([]);
  });
});
