import { GenderConfidenceType, GenderSourceType, GenderType } from './gender.enum';

/**
 * A single race participant.
 *
 * Distance semantics:
 * - 2 laps → finished 5 km (lap 1 is the 2.3 km split);
 * - 1 lap → ran 2.3 km only;
 * - `totalMs` null → DNF.
 *
 * All times are integer milliseconds.
 */
export interface Participant {
  id: number;
  fullName: string;
  totalMs: number | null;
  lapsMs: (number | null)[];
  gender: GenderType | null;
  genderConfidence: GenderConfidenceType;
  genderSource: GenderSourceType;
  note: string;
  club: string;
}
