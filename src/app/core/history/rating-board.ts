import { AthleteRecord } from '../models/athlete-history.interface';
import { GenderType } from '../models/gender.enum';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { CourseRecordHistory } from './course-records.type';
import { formIndex, localGrade, runnerRank, scoredRuns, windowScoredRuns } from './runner-scores';
import { EventWinnerTimes, RatingRow } from './runner-scores.interface';

/**
 * The combined М+Ж rating board: every gendered athlete with a scored finish inside the
 * form-index year, «кто сейчас в форме» first. Scores are percents of the own-gender winner,
 * so men and women share one honest table; a tied index falls back to the runner rank, then
 * to the name. Athletes silent for over a year drop off — the rating stays alive.
 */
export function ratingBoard(
  records: readonly AthleteRecord[],
  winners: ReadonlyMap<string, EventWinnerTimes>,
  courseRecords: CourseRecordHistory,
  todayIso: string,
): RatingRow[] {
  return records
    .flatMap<RatingRow>((record) => {
      if (record.gender === null) {
        return [];
      }

      const row = toRatingRow(record, record.gender, winners, courseRecords, todayIso);

      return row === null ? [] : [row];
    })
    .sort(
      (left, right) =>
        right.formIndex - left.formIndex ||
        right.runnerRank - left.runnerRank ||
        left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE),
    );
}

/** One athlete's row; null for the never-scored and for those without a window finish. */
function toRatingRow(
  record: AthleteRecord,
  gender: GenderType,
  winners: ReadonlyMap<string, EventWinnerTimes>,
  courseRecords: CourseRecordHistory,
  todayIso: string,
): RatingRow | null {
  const scored = scoredRuns(record.runs, gender, winners);
  const rank = runnerRank(scored);

  if (rank === null) {
    return null;
  }

  const index = formIndex(scored, todayIso);

  if (index === null) {
    return null;
  }

  return {
    key: record.key,
    displayName: record.displayName,
    gender,
    formIndex: index,
    runnerRank: rank,
    localGrade: localGrade(record.bestMs, courseRecords[gender].at(-1)?.timeMs ?? null),
    formRunCount: windowScoredRuns(scored, todayIso).length,
  };
}
