import { EMPTY_COURSE_RECORD_HISTORY } from './course-records.constant';
import { ratingBoard } from './rating-board';
import { BOARD_COURSE_RECORDS, BOARD_EVENTS, BOARD_RECORDS, BOARD_TODAY_ISO, EXPECTED_BOARD } from './rating-board.mock';
import { winnerTimesBySlug } from './runner-scores';

describe('ratingBoard', () => {
  const winners = winnerTimesBySlug(BOARD_EVENTS);

  it('ranks the gendered in-form athletes by index, rank and name, skipping the rest', () => {
    expect(ratingBoard(BOARD_RECORDS, winners, BOARD_COURSE_RECORDS, BOARD_TODAY_ISO)).toEqual(EXPECTED_BOARD);
    expect(
      ratingBoard(BOARD_RECORDS, winners, EMPTY_COURSE_RECORD_HISTORY, BOARD_TODAY_ISO).map((row) => row.localGrade),
      'recordless genders grade nobody',
    ).toEqual([null, null, null, null]);
    expect(ratingBoard([], winners, BOARD_COURSE_RECORDS, BOARD_TODAY_ISO), 'no athletes — no board').toEqual([]);
  });
});
