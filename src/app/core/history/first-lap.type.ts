import { GenderType } from '../models/gender.enum';
import { FirstLapRun } from './first-lap.interface';

/** The standing first-lap record per gender; null while no split is recorded for that board. */
export type FirstLapRecords = Record<GenderType, FirstLapRun | null>;
