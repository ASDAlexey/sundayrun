import { type GenderType } from '../models/gender.enum';
import { type CourseRecordEntry } from './course-records.interface';

/** The course record progression per gender, oldest first; the last entry holds the current record. */
export type CourseRecordHistory = Record<GenderType, CourseRecordEntry[]>;
