import { Gender } from '../models/gender.enum';
import { CourseRecordHistory } from './course-records.type';

/** The progression before any data arrives — both genders still without a record. */
export const EMPTY_COURSE_RECORD_HISTORY: CourseRecordHistory = { [Gender.male]: [], [Gender.female]: [] };
