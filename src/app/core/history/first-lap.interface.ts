import { GenderType } from '../models/gender.enum';

/** One 5 km finisher's first-lap (2.3 km) split with athlete identity — the record scan input. */
export interface FirstLapRun {
  key: string;
  displayName: string;
  gender: GenderType;
  dateIso: string;
  slug: string;
  lapMs: number;
}

/** One first-lap split of a single athlete's run — the athlete-page best-lap input. */
export interface AthleteFirstLap {
  dateIso: string;
  slug: string;
  lapMs: number;
}
