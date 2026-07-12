import { NotableKindType } from './notables.enum';

/** One run of an event participant as the notables builder consumes it; keyed selects feed it. */
export interface ParticipantRun {
  athleteKey: string;
  dateIso: string;
  slug: string;
  timeMs: number;
  distanceKm: number;
}

/** The notable of one finisher: a career rank (2 or 3) or the best run of the trailing window. */
export interface Notable {
  kind: NotableKindType;
  /** 2 or 3 for `allTimeRank`; null for `windowBest`. */
  rank: number | null;
}
