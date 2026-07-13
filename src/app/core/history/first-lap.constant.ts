import { Gender } from '../models/gender.enum';
import { FirstLapRecords } from './first-lap.type';

/** The record state before any split is recorded. */
export const EMPTY_FIRST_LAP_RECORDS: FirstLapRecords = { [Gender.male]: null, [Gender.female]: null };
