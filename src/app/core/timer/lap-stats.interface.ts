import { GenderType } from '../models/gender.enum';
import { ExpectedLapSample } from './runner-order.interface';

/**
 * One archived 2.3 km split of one athlete, plus the gender the course record is decided per.
 * `PacingRow` already carries all three fields, so the archive read feeds this straight in.
 */
export interface LapStatsSample extends ExpectedLapSample {
  gender: GenderType | null;
}

/** Everything the live «Круг» table and the roster sheet read out of the archived first laps. */
export interface LapStats {
  /** Athlete key → median first lap: the order tiles are laid out in before the start. */
  expectedLapMs: ReadonlyMap<string, number>;
  /** Athlete key → fastest first lap ever: what «быстрее своего лучшего круга» compares against. */
  bestLapMs: ReadonlyMap<string, number>;
  /** Athlete key → how many timed first laps the archive holds — a plain regularity proxy. */
  appearanceCount: ReadonlyMap<string, number>;
  /** Fastest first lap of the whole archive per gender; null when the archive has none. */
  courseRecordLapMs: Readonly<Record<GenderType, number | null>>;
}
