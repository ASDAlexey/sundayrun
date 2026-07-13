import { GenderType } from '../models/gender.enum';

/** The protocol cells the gap scan reads — a subset of `ProtocolRow`. */
export interface PlaceGapRow {
  gender: GenderType | null;
  distanceKm: number | null;
  totalMs: number | null;
  placeM: number | null;
  placeF: number | null;
}
