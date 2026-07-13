import { courseRecordHistory, currentCourseRecordEntries } from './course-records';
import { EMPTY_COURSE_RECORD_HISTORY } from './course-records.constant';
import { COURSE_RECORD_RUNS, EXPECTED_COURSE_RECORD_HISTORY, EXPECTED_CURRENT_RECORD_ENTRIES } from './course-records.mock';

describe('courseRecordHistory', () => {
  it('keeps every record-beating run per gender in date order and leaves ties with the first setter', () => {
    expect(courseRecordHistory(COURSE_RECORD_RUNS)).toEqual(EXPECTED_COURSE_RECORD_HISTORY);
    expect(courseRecordHistory([]), 'no runs yield empty progressions for both genders').toEqual(EMPTY_COURSE_RECORD_HISTORY);
  });
});

describe('currentCourseRecordEntries', () => {
  it('returns the standing king and queen and crowns nobody on an empty history', () => {
    expect(currentCourseRecordEntries(EXPECTED_COURSE_RECORD_HISTORY)).toEqual(EXPECTED_CURRENT_RECORD_ENTRIES);
    expect(currentCourseRecordEntries(EMPTY_COURSE_RECORD_HISTORY)).toEqual([]);
  });
});
