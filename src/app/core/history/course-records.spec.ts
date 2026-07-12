import { courseRecordHistory } from './course-records';
import { EMPTY_COURSE_RECORD_HISTORY } from './course-records.constant';
import { COURSE_RECORD_RUNS, EXPECTED_COURSE_RECORD_HISTORY } from './course-records.mock';

describe('courseRecordHistory', () => {
  it('keeps every record-beating run per gender in date order and leaves ties with the first setter', () => {
    expect(courseRecordHistory(COURSE_RECORD_RUNS)).toEqual(EXPECTED_COURSE_RECORD_HISTORY);
    expect(courseRecordHistory([]), 'no runs yield empty progressions for both genders').toEqual(EMPTY_COURSE_RECORD_HISTORY);
  });
});
