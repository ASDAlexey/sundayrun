import type { GenderConfidenceType, GenderSourceType, GenderType } from '../models/gender.enum';

export interface GenderInference {
  /** Inferred gender, or null when the name is ambiguous or unresolvable. */
  gender: GenderType | null;
  confidence: GenderConfidenceType;
  source: GenderSourceType;
}
