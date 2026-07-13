import { Gender } from '../models/gender.enum';
import { buildSeasonPositions } from './season-positions';
import {
  EXPECTED_MEN_LINES,
  EXPECTED_MEN_RANKED_COUNT,
  EXPECTED_WOMEN_POSITIONS,
  SEASON_EVENT_DATES,
  SEASON_RUNS,
} from './season-positions.mock';

describe('buildSeasonPositions', () => {
  it('re-ranks season bests after every event, lines up every ranked athlete and starts lines at the debut', () => {
    expect(buildSeasonPositions(SEASON_RUNS, Gender.male)).toEqual({
      eventDates: SEASON_EVENT_DATES,
      lines: EXPECTED_MEN_LINES,
      rankedCount: EXPECTED_MEN_RANKED_COUNT,
    });
    expect(buildSeasonPositions(SEASON_RUNS, Gender.female), 'the women’s chart sees only women’s finishes').toEqual(
      EXPECTED_WOMEN_POSITIONS,
    );
    expect(buildSeasonPositions([], Gender.male), 'no runs mean an empty chart').toEqual({ eventDates: [], lines: [], rankedCount: 0 });
  });
});
