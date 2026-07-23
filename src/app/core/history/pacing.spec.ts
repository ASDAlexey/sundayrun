import { athletePacing, isNegativeSplit, lapPlaceDeltas, meetingSplitLeads, pacingBoards, pacingIndex } from './pacing';
import { PacingProfile } from './pacing.enum';
import {
  EMPTY_BOARDS,
  EVEN_LAP_MS,
  EVEN_TOTAL_MS,
  EXPECTED_2025_BOARDS,
  EXPECTED_ALL_TIME_SECOND_HALF,
  EXPECTED_ATHLETE_PACING,
  EXPECTED_LAP_DELTAS,
  EXPECTED_SPLIT_LEADS,
  FADE_LAP_MS,
  FADE_PROFILE_LAPS,
  LAP_DELTA_ROWS,
  LEFT_MEETING_LAPS,
  NEGATIVE_LAP_MS,
  NEGATIVE_PROFILE_LAPS,
  NEGATIVE_PROFILE_RUNS,
  NOISE_LAP_MS,
  NOISE_TOTAL_MS,
  PACING_BOARD_ROWS,
  PACING_LAPS,
  PACING_RUNS,
  RIGHT_MEETING_LAPS,
  SPLIT_LEAD_MEETINGS,
  indexOf,
} from './pacing.mock';

describe('pacingIndex', () => {
  it('normalizes the uneven laps to paces: the even run reads exactly 1, a negative split below it', () => {
    expect(pacingIndex(EVEN_LAP_MS, EVEN_TOTAL_MS)).toBe(1);
    expect(pacingIndex(NEGATIVE_LAP_MS, EVEN_TOTAL_MS)).toBeLessThan(1);
    expect(pacingIndex(FADE_LAP_MS, EVEN_TOTAL_MS)).toBeGreaterThan(1);
  });

  it('rejects non-positive laps and indexes outside the plausibility corridor', () => {
    expect(pacingIndex(0, EVEN_TOTAL_MS)).toBeNull();
    expect(pacingIndex(EVEN_TOTAL_MS, EVEN_LAP_MS)).toBeNull();
    expect(pacingIndex(NOISE_LAP_MS, NOISE_TOTAL_MS)).toBeNull();
    expect(pacingIndex(400_000, EVEN_TOTAL_MS)).toBeNull();
  });
});

describe('isNegativeSplit', () => {
  it('marks only a strictly faster second-lap pace', () => {
    expect(isNegativeSplit(indexOf(NEGATIVE_LAP_MS, EVEN_TOTAL_MS))).toBe(true);
    expect(isNegativeSplit(1)).toBe(false);
  });
});

describe('athletePacing', () => {
  it('joins laps to 5 km runs by slug, drops noise, keeps the earlier best split on a tie', () => {
    expect(athletePacing(PACING_RUNS, PACING_LAPS)).toEqual(EXPECTED_ATHLETE_PACING);
  });

  it('classifies a habitual negative splitter and a fast-start fader', () => {
    expect(athletePacing(NEGATIVE_PROFILE_RUNS, NEGATIVE_PROFILE_LAPS)?.profile).toBe(PacingProfile.negative);
    expect(athletePacing(NEGATIVE_PROFILE_RUNS, FADE_PROFILE_LAPS)?.profile).toBe(PacingProfile.fade);
  });

  it('hides behind null below the minimum of valid splits', () => {
    expect(athletePacing(NEGATIVE_PROFILE_RUNS.slice(0, 2), NEGATIVE_PROFILE_LAPS)).toBeNull();
  });
});

describe('lapPlaceDeltas', () => {
  it('ranks plausible 5 km finishers by lap and by finish, keeps every other row null', () => {
    expect(lapPlaceDeltas(LAP_DELTA_ROWS)).toEqual(EXPECTED_LAP_DELTAS);
  });
});

describe('pacingBoards', () => {
  it('decides both nominations per gender within one season, breaking ties by the name', () => {
    expect(pacingBoards(PACING_BOARD_ROWS, '2025')).toEqual(EXPECTED_2025_BOARDS);
  });

  it('spans the whole history when the year is null', () => {
    const boards = pacingBoards(PACING_BOARD_ROWS, null);

    expect(boards.secondHalf).toEqual(EXPECTED_ALL_TIME_SECOND_HALF);
    expect(boards.evenest).toEqual(EXPECTED_2025_BOARDS.evenest);
  });

  it('leaves every slot null while nobody reaches the minimum or a positive gain', () => {
    expect(pacingBoards(PACING_BOARD_ROWS, '2024')).toEqual(EMPTY_BOARDS);
  });
});

describe('meetingSplitLeads', () => {
  it('pairs both plausible splits per shared race, null when either side lacks or fumbles one', () => {
    expect(meetingSplitLeads(SPLIT_LEAD_MEETINGS, LEFT_MEETING_LAPS, RIGHT_MEETING_LAPS)).toEqual(EXPECTED_SPLIT_LEADS);
  });
});
