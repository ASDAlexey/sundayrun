import { Gender } from '../models/gender.enum';
import {
  athleteRating,
  formIndex,
  isFormStale,
  localGrade,
  newestEventIso,
  runnerRank,
  scoredRuns,
  winnerTimesBySlug,
} from './runner-scores';
import {
  ANCHOR_EVENT,
  EMPTY_RATING,
  EXPECTED_MALE_FORM_INDEX,
  EXPECTED_MALE_RANK,
  EXPECTED_MALE_RATING,
  EXPECTED_MALE_SCORED,
  EXPECTED_TRIM_FORM_INDEX,
  MALE_COURSE_RECORD_MS,
  MALE_RUNS,
  SCORES_TODAY_ISO,
  TRIM_EVENTS,
  TRIM_RUNS,
  WINNER_EVENTS,
} from './runner-scores.mock';

describe('runner scores', () => {
  const winners = winnerTimesBySlug(WINNER_EVENTS);

  it('scores 5 km finishes against the own-gender winner and averages them into the rank', () => {
    const scored = scoredRuns(MALE_RUNS, Gender.male, winners);

    expect(scored, 'one-lap and unwinnered runs score nothing; the rest sort oldest first').toEqual(EXPECTED_MALE_SCORED);
    expect(runnerRank(scored)).toBe(EXPECTED_MALE_RANK);
    expect(runnerRank([]), 'nothing scored — no rank').toBeNull();
    expect(scoredRuns(MALE_RUNS, Gender.female, winners), 'a female run has no female winner at these events').toHaveLength(2);
    expect(newestEventIso([...WINNER_EVENTS, ANCHOR_EVENT]), 'the newest event day anchors the form year').toBe(SCORES_TODAY_ISO);
    expect(newestEventIso([ANCHOR_EVENT, ...WINNER_EVENTS]), 'the scan never relies on the event order').toBe(SCORES_TODAY_ISO);
    expect(newestEventIso([]), 'an empty archive anchors nothing').toBe('');
  });

  it('weights the top window scores by freshness and trims the list to the top count', () => {
    const scored = scoredRuns(MALE_RUNS, Gender.male, winners);

    expect(formIndex(scored, SCORES_TODAY_ISO)).toBe(EXPECTED_MALE_FORM_INDEX);
    expect(formIndex(scored.slice(0, 1), SCORES_TODAY_ISO), 'a year without a scored finish makes no index').toBeNull();
    expect(formIndex(scoredRuns(TRIM_RUNS, Gender.male, winnerTimesBySlug(TRIM_EVENTS)), SCORES_TODAY_ISO)).toBe(EXPECTED_TRIM_FORM_INDEX);
  });

  it('drops the form index once the newest finish predates the freshness window', () => {
    const scored = scoredRuns(MALE_RUNS, Gender.male, winners);
    const staleWithinYear = scored.slice(0, 2);

    expect(isFormStale(scored, SCORES_TODAY_ISO), 'a 30-day-old newest finish is fresh').toBe(false);
    expect(isFormStale(staleWithinYear, SCORES_TODAY_ISO), 'a 244-day-old newest finish is stale, though inside the year').toBe(true);
    expect(isFormStale([], SCORES_TODAY_ISO), 'a runless scan is trivially stale').toBe(true);
    expect(formIndex(staleWithinYear, SCORES_TODAY_ISO), 'the window still holds it, but the break erases the index').toBeNull();
  });

  it('grades the best against the course record and assembles the whole card', () => {
    expect(localGrade(1_140_000, MALE_COURSE_RECORD_MS)).toBe(96.5);
    expect(localGrade(null, MALE_COURSE_RECORD_MS), 'no best — no grade').toBeNull();
    expect(localGrade(1_140_000, null), 'no record — no grade').toBeNull();
    expect(athleteRating(MALE_RUNS, Gender.male, winners, MALE_COURSE_RECORD_MS, SCORES_TODAY_ISO)).toEqual(EXPECTED_MALE_RATING);
    expect(athleteRating(MALE_RUNS, null, winners, MALE_COURSE_RECORD_MS, SCORES_TODAY_ISO), 'genderless — empty card').toEqual(
      EMPTY_RATING,
    );
    expect(athleteRating([], Gender.male, winners, MALE_COURSE_RECORD_MS, SCORES_TODAY_ISO), 'runless — empty card').toEqual(EMPTY_RATING);
  });
});
