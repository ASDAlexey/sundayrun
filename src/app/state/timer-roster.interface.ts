import { GenderType } from '../core/models/gender.enum';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { LapStats } from '../core/timer/lap-stats.interface';

/**
 * One directory entry as the offline cache stores it. The full `AthleteRecord` carries every run of
 * every athlete — tens of megabytes that localStorage would refuse — and the roster sheet needs none
 * of it: a name to search, a name to show, and the gender that saves the organiser a question.
 */
export interface CachedAthleteEntry {
  key: string;
  displayName: string;
  gender: GenderType | null;
}

/**
 * The directory as the service holds it: records for the search plus the whole archive read of the
 * first laps — the tile order, the two marks of the live «Круг» table and the regularity count.
 * Named apart from the cache because either source can produce it — the materialised `meta` row of
 * the archive or, on an archive published without one, the two full scans it replaces.
 */
export interface TimerRosterSnapshot extends LapStats {
  records: AthleteRecord[];
}

/** A snapshot on its way through localStorage, which is the only state a park with no signal sees. */
export interface TimerRosterCache extends TimerRosterSnapshot {
  /** When the cache was written; null while the device has never read the directory. */
  savedAtMs: number | null;
}
