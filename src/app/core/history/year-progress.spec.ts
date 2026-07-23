import { yearProgressBoard } from './year-progress';
import { EXPECTED_PROGRESS_ROWS, PROGRESS_DISPLAY_NAMES, PROGRESS_HISTORY_ROWS, PROGRESS_YEAR } from './year-progress.mock';

describe('yearProgressBoard', () => {
  it('ranks improved season medians with the name tie-break and drops sparse, slower, debut and departed athletes', () => {
    expect(yearProgressBoard(PROGRESS_YEAR, PROGRESS_DISPLAY_NAMES, PROGRESS_HISTORY_ROWS)).toEqual(EXPECTED_PROGRESS_ROWS);
  });

  it('collapses to an empty board when the archive holds no comparable seasons', () => {
    expect(yearProgressBoard(PROGRESS_YEAR, PROGRESS_DISPLAY_NAMES, [])).toEqual([]);
  });
});
