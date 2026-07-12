import { GenderType } from '../models/gender.enum';

/** One finished 5 km run with its athlete identity — the input of the record progression scan. */
export interface CourseRecordRun {
  key: string;
  displayName: string;
  gender: GenderType;
  dateIso: string;
  slug: string;
  timeMs: number;
}

/** One progression step: the run that set a new course record. `previousMs` is the record it beat. */
export interface CourseRecordEntry extends CourseRecordRun {
  previousMs: number | null;
}
