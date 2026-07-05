import { GenderType } from '../models/gender.enum';

/** Event identity attached to every appended run. */
export interface EventRef {
  slug: string;
  dateIso: string;
}

/** One participant's result to roll into the athletes history. */
export interface EventResult {
  fullName: string;
  gender: GenderType | null;
  timeMs: number | null;
  distanceKm: number;
}
