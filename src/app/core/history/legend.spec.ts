import { legendBoard, legendProgress } from './legend';
import { LEGEND_BOARD_CASES, LEGEND_PROGRESS_CASES } from './legend.mock';

describe('legendBoard', () => {
  it('anchors the window at the newest finish, tallies per athlete and crowns by count → earliest → name', () => {
    for (const [label, finishes, windowDays, expected] of LEGEND_BOARD_CASES) {
      expect(windowDays === undefined ? legendBoard(finishes) : legendBoard(finishes, windowDays), label).toEqual(expected);
    }
  });
});

describe('legendProgress', () => {
  it('reports the crown for the holder and the finishes left to overtake for everyone else', () => {
    for (const [label, board, athleteKey, expected] of LEGEND_PROGRESS_CASES) {
      expect(legendProgress(board, athleteKey), label).toEqual(expected);
    }
  });
});
