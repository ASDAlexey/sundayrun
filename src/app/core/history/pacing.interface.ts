import { GenderType } from '../models/gender.enum';
import { PacingProfileType } from './pacing.enum';

/** The split-bearing cells of one protocol row — the lap-delta scan needs nothing else. */
export interface LapDeltaRow {
  time23: string;
  totalMs: number | null;
  distanceKm: number | null;
}

/** One 5 km finish with a recorded first-lap split — the scan unit of the season boards. */
export interface PacingRow {
  key: string;
  displayName: string;
  gender: GenderType | null;
  /** The event slug, doubling as the ISO event date. */
  slug: string;
  lapMs: number;
  totalMs: number;
}

/** The run with the athlete's most negative split — the smallest index of the history. */
export interface BestSplitRun {
  slug: string;
  dateIso: string;
  index: number;
}

/** The athlete's pacing profile over every run with a plausible recorded split. */
export interface AthletePacing {
  profile: PacingProfileType;
  /** The median pacing index — the lap 2 pace over the lap 1 pace; 1 is perfectly even. */
  medianIndex: number;
  validCount: number;
  negativeSplitCount: number;
  bestSplit: BestSplitRun;
}

/** «Самый ровный бегун»: the smallest median per-run deviation from the even index. */
export interface EvenestRunner {
  key: string;
  displayName: string;
  /** The median of per-run |index − 1|; 0 is metronome-even. */
  deviation: number;
  count: number;
}

/** The deviations of one athlete's scoped runs, accumulated before the board is decided. */
export interface EvenestTally {
  key: string;
  displayName: string;
  gender: GenderType;
  deviations: number[];
}

/** «Лучший финишёр второй половины»: the most on-course places gained on lap 2 over the scope. */
export interface SecondHalfFinisher {
  key: string;
  displayName: string;
  gainedPlaces: number;
  count: number;
}

/** One athlete's running lap-delta total, accumulated before the board is decided. */
export interface SecondHalfTally {
  key: string;
  displayName: string;
  gender: GenderType;
  gainedPlaces: number;
  count: number;
}

/** The two pacing nominations of one scope, decided per gender; null while nobody qualifies. */
export interface PacingBoards {
  evenest: Record<GenderType, EvenestRunner | null>;
  secondHalf: Record<GenderType, SecondHalfFinisher | null>;
}

/** One shared race narrowed to what the split-lead scan needs. */
export interface SplitLeadMeeting {
  slug: string;
  leftMs: number;
  rightMs: number;
}

/** Both duellists' first-lap splits of one shared race; the duel page marks who led at 2,3 км. */
export interface MeetingSplits {
  leftLapMs: number;
  rightLapMs: number;
}
