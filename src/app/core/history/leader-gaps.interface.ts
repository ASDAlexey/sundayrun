import { type GenderType } from '../models/gender.enum';

/** The protocol cells the leader-gap scan reads — a subset of `ProtocolRow`. */
export interface LeaderGapRow {
  gender: GenderType | null;
  distanceKm: number | null;
  totalMs: number | null;
}
